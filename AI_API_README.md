# AI API Documentation

This project includes a serverless AI chat API that supports streaming responses from both OpenAI and OpenRouter.

## Features

- ✅ **Streaming Responses**: Real-time text streaming for better UX
- ✅ **Multiple Providers**: Support for OpenAI and OpenRouter
- ✅ **Model Selection**: Configurable AI models
- ✅ **Project Context**: Optional project ID for context-aware responses
- ✅ **Error Handling**: Comprehensive error handling and validation
- ✅ **CORS Support**: Ready for cross-origin requests

## API Endpoint

**POST** `/api/ai`

### Request Body

```typescript
{
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  projectId?: string; // Optional project context
}
```

### Response

Returns a streaming response with `Content-Type: text/event-stream`.

## Environment Variables

### Required (Choose One)

```env
# For OpenAI
OPENAI_API_KEY=your-openai-api-key

# OR for OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key
```

### Optional

```env
# Provider selection (default: openai)
PROVIDER=openai  # or "openrouter"

# Model selection (default: gpt-4o-mini)
MODEL=gpt-4o-mini  # or "gpt-4.1-mini" for OpenRouter
```

## Deployment

### Vercel

1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. The function will be available at `https://your-app.vercel.app/api/ai`

### Netlify Functions

1. Deploy to Netlify
2. Set environment variables in Netlify dashboard
3. The function will be available at `https://your-app.netlify.app/.netlify/functions/ai`

### Other Platforms

The function is compatible with any Node.js serverless platform that supports:
- ES modules
- Fetch API
- ReadableStream

## Client Usage

### Basic Usage

```typescript
import { aiClient } from './lib/ai-client';

// Simple chat
const response = await aiClient.chat([
  { role: 'user', content: 'Hello, how are you?' }
]);

console.log(response);
```

### Streaming Usage

```typescript
import { aiClient } from './lib/ai-client';

await aiClient.streamChat(
  [{ role: 'user', content: 'Tell me a story' }],
  {
    onMessage: (content) => {
      console.log('New content:', content);
    },
    onComplete: (fullContent) => {
      console.log('Complete response:', fullContent);
    },
    onError: (error) => {
      console.error('Error:', error);
    }
  },
  'project-123' // Optional project ID
);
```

### React Component

```tsx
import { ChatInterface } from './components/ai/ChatInterface';

function MyApp() {
  return (
    <ChatInterface 
      projectId="my-project"
      apiUrl="/api/ai"
    />
  );
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `400`: Bad request (invalid input)
- `401`: Unauthorized (missing API key)
- `429`: Rate limit exceeded
- `500`: Internal server error

## Supported Models

### OpenAI
- `gpt-4o-mini` (default)
- `gpt-4o`
- `gpt-3.5-turbo`

### OpenRouter
- `gpt-4o-mini`
- `gpt-4.1-mini`
- `claude-3-sonnet`
- `claude-3-haiku`
- And many more...

## Testing

1. Start your development server
2. Navigate to `/ai-test` (if using the test page)
3. Or use the API directly with curl:

```bash
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "projectId": "test-project"
  }'
```

## Security Notes

- API keys are server-side only
- CORS is configured for cross-origin requests
- Input validation prevents malicious requests
- Rate limiting should be configured at the platform level

## Troubleshooting

### Common Issues

1. **"API key configuration error"**
   - Check that your API key environment variable is set
   - Verify the PROVIDER setting matches your API key

2. **"Rate limit exceeded"**
   - Wait before making more requests
   - Consider upgrading your API plan

3. **Streaming not working**
   - Check that your client supports ReadableStream
   - Verify the API endpoint is accessible

4. **CORS errors**
   - Ensure the API is deployed and accessible
   - Check that VITE_AI_API_URL points to the correct endpoint
