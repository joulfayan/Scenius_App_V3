// AI Client for consuming the streaming chat API

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  projectId?: string;
}

export interface StreamResponse {
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

export interface AIStreamOptions {
  onMessage?: (content: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
  apiUrl?: string;
}

export class AIClient {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    // Use environment variable or default to Vercel dev server
    this.apiUrl = apiUrl || import.meta.env.VITE_AI_API_URL || 'http://localhost:3001/api/ai';
  }

  async streamChat(
    messages: ChatMessage[],
    options: AIStreamOptions = {},
    projectId?: string
  ): Promise<void> {
    const { onMessage, onComplete, onError, apiUrl = this.apiUrl } = options;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete?.(fullContent);
                return;
              }

              try {
                const parsed: StreamResponse = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  onMessage?.(content);
                }
              } catch (e) {
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('AI Stream Error:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Convenience method for simple chat
  async chat(
    messages: ChatMessage[],
    projectId?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      
      this.streamChat(messages, {
        onMessage: (content) => {
          fullContent += content;
        },
        onComplete: (content) => {
          resolve(content);
        },
        onError: (error) => {
          reject(error);
        },
      }, projectId);
    });
  }
}

// Default instance
export const aiClient = new AIClient();

// React hook for AI chat
export function useAIChat(apiUrl?: string) {
  const client = new AIClient(apiUrl);

  const sendMessage = async (
    messages: ChatMessage[],
    projectId?: string,
    options?: Omit<AIStreamOptions, 'apiUrl'>
  ) => {
    return client.streamChat(messages, options, projectId);
  };

  const sendMessageSync = async (
    messages: ChatMessage[],
    projectId?: string
  ) => {
    return client.chat(messages, projectId);
  };

  return {
    sendMessage,
    sendMessageSync,
    client,
  };
}
