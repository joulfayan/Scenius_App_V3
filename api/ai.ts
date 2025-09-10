// Serverless AI API endpoint
// This can be deployed to Vercel, Netlify Functions, or similar platforms

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  projectId?: string;
}

interface StreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// Environment configuration
const PROVIDER = process.env.PROVIDER || 'openai';
const MODEL = process.env.MODEL || (PROVIDER === 'openrouter' ? 'gpt-4o-mini' : 'gpt-4o-mini');

// Get API key based on provider
function getApiKey(): string {
  if (PROVIDER === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('OPENROUTER_API_KEY environment variable is required when PROVIDER=openrouter');
    }
    return key;
  } else {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is required when PROVIDER=openai');
    }
    return key;
  }
}

// Get base URL based on provider
function getBaseURL(): string {
  if (PROVIDER === 'openrouter') {
    return 'https://openrouter.ai/api/v1';
  }
  return 'https://api.openai.com/v1';
}

// Create fetch client for API calls
async function createChatCompletion(messages: ChatMessage[], projectId?: string) {
  const apiKey = getApiKey();
  const baseURL = getBaseURL();
  
  // Add project context if provided
  let systemMessages = messages.filter(m => m.role === 'system');
  if (projectId && systemMessages.length === 0) {
    systemMessages = [{
      role: 'system',
      content: `You are assisting with project ID: ${projectId}. Provide helpful and relevant responses.`
    }];
  }

  // Prepare messages for API
  const apiMessages = [
    ...systemMessages,
    ...messages.filter(m => m.role !== 'system')
  ];

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response;
}

// Stream response helper
function createStreamResponse(stream: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const reader = stream.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
              } catch (e) {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
        
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Main handler function
export async function handler(request: Request): Promise<Response> {
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { messages, projectId } = body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required and cannot be empty' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return new Response(
          JSON.stringify({ error: 'Each message must have role and content' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be system, user, or assistant' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Create streaming completion
    const stream = await createChatCompletion(messages, projectId);

    // Return streaming response
    return createStreamResponse(stream.body!);

  } catch (error) {
    console.error('AI API Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response(
          JSON.stringify({ error: 'API key configuration error. Please check your environment variables.' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      if (error.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Export for different platforms
export default handler;

// For Vercel
export { handler as POST, handler as OPTIONS };

// For Netlify Functions
export { handler as default };