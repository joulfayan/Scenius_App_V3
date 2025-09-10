# AI Assistant Guide

## Overview

The Scenius App includes a comprehensive AI assistant system designed to help with film production tasks. The assistant features streaming responses, quick actions, and Firebase authentication integration.

## Components

### 1. FloatingAssistant
- **Location**: Bottom-right corner of the app
- **Features**: Always available, floating chat button
- **Usage**: Click to open/close the assistant panel

### 2. AssistantPanel
- **Location**: Can be embedded anywhere in the app
- **Features**: Full chat interface with quick actions
- **Usage**: Import and use in any component

### 3. AssistantDemo
- **Location**: `/assistant-demo` route
- **Features**: Full-featured demo with instructions
- **Usage**: Test all assistant features

## Quick Actions

### Format Script
- **Purpose**: Script formatting and structure assistance
- **System Prompt**: Professional script formatter
- **Use Cases**: 
  - Fix formatting issues
  - Improve script structure
  - Apply industry standards

### Breakdown Scene
- **Purpose**: Production breakdown and element identification
- **System Prompt**: Production assistant
- **Use Cases**:
  - Identify props and locations
  - List character requirements
  - Technical requirements

### Generate Shotlist
- **Purpose**: Cinematography and shot planning
- **System Prompt**: Cinematography expert
- **Use Cases**:
  - Create detailed shot lists
  - Camera angles and movements
  - Technical specifications

## Authentication

The assistant requires Firebase authentication:

```typescript
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase.client';

const [user, loading, error] = useAuthState(auth);
```

## Streaming Responses

The assistant uses ReadableStream for real-time response streaming:

```typescript
const response = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, projectId })
});

const reader = response.body.getReader();
// Stream processing...
```

## Usage Examples

### Basic Usage
```tsx
import { AssistantPanel } from '../modules/assistant/AssistantPanel';

<AssistantPanel 
  projectId="my-project"
  onClose={() => setOpen(false)}
/>
```

### Floating Assistant
```tsx
import { FloatingAssistant } from '../components/assistant/FloatingAssistant';

<FloatingAssistant projectId="my-project" />
```

### Custom Integration
```tsx
import { AssistantPanel } from '../modules/assistant/AssistantPanel';

function MyPage() {
  const [showAssistant, setShowAssistant] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowAssistant(true)}>
        Open Assistant
      </Button>
      
      {showAssistant && (
        <AssistantPanel 
          projectId="current-project"
          onClose={() => setShowAssistant(false)}
        />
      )}
    </div>
  );
}
```

## API Integration

The assistant communicates with the `/api/ai` endpoint:

```typescript
interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  projectId?: string;
}
```

## Error Handling

The assistant includes comprehensive error handling:

- **Authentication Errors**: Shows login prompt
- **Network Errors**: Displays error messages
- **Streaming Errors**: Graceful fallback
- **Cancellation**: AbortController for request cancellation

## Customization

### Quick Actions
Add custom quick actions by modifying the `QUICK_ACTIONS` array:

```typescript
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'custom-action',
    label: 'Custom Action',
    icon: <CustomIcon className="h-4 w-4" />,
    systemPrompt: 'Custom system prompt...',
    description: 'Custom description...'
  }
];
```

### Styling
The assistant uses Tailwind CSS classes and can be customized:

```tsx
<AssistantPanel 
  className="custom-styles"
  projectId="my-project"
/>
```

## Development

### Testing
- Use `/assistant-demo` for full testing
- Check authentication state
- Test streaming responses
- Verify quick actions

### Debugging
- Check browser console for errors
- Verify API endpoint is accessible
- Check Firebase auth state
- Monitor network requests

## Production Deployment

1. **Deploy API**: Ensure `/api/ai` is deployed and accessible
2. **Set Environment Variables**: Configure `VITE_AI_API_URL`
3. **Firebase Auth**: Ensure Firebase is properly configured
4. **Test**: Verify all features work in production

## Troubleshooting

### Common Issues

1. **"Authentication Required"**
   - Check Firebase auth configuration
   - Verify user is logged in

2. **"API key configuration error"**
   - Check serverless function environment variables
   - Verify API keys are set

3. **Streaming not working**
   - Check API endpoint accessibility
   - Verify ReadableStream support

4. **Quick actions not working**
   - Check system prompt configuration
   - Verify message handling

### Support

For issues or questions:
- Check the browser console for errors
- Verify environment configuration
- Test with the demo page
- Check API endpoint status
