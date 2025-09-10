# Scenius App V3

A comprehensive film production management application built with Vite + React, featuring AI-powered assistance and Firebase integration.

## Features

- 🎬 **Production Management**: Script editing, shot lists, call sheets, and more
- 🤖 **AI Assistant**: Streaming chat interface with OpenAI/OpenRouter support
- 🔥 **Firebase Integration**: Real-time data synchronization and storage
- 📱 **Responsive Design**: Modern UI with Tailwind CSS and Radix UI components
- 🔧 **Environment Validation**: Automatic configuration checking and error handling

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file with your configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# AI API Configuration
VITE_AI_API_URL=/api/ai
```

### 3. Run Development Servers

**Option A: Full Development (Frontend + API)**
```bash
npm run dev:all
```
This runs both the Vite frontend (port 5173) and Vercel API server (port 3001) concurrently.

**Option B: Frontend Only**
```bash
npm run dev
```

**Option C: API Only**
```bash
npm run dev:api
```

### 4. Check Configuration

```bash
npm run check-firebase
```

## Development

### Development Scripts

- `npm run dev` - Start Vite development server (frontend only)
- `npm run dev:api` - Start Vercel development server (API only)
- `npm run dev:all` - Start both frontend and API concurrently
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check-firebase` - Validate Firebase configuration
- `npm run test-dev` - Test development setup

### Development URLs

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001/api/ai
- **AI Test Page**: http://localhost:5173/ai-test
- **Assistant Demo**: http://localhost:5173/assistant-demo
- **Context Test**: http://localhost:5173/context-test
- **Prompt Test**: http://localhost:5173/prompt-test
- **Service Integration Test**: http://localhost:5173/service-integration-test

## AI Features

The app includes a comprehensive AI assistant system:

### Floating Assistant
- **Always Available**: Floating chat button in bottom-right corner
- **Authentication Required**: Firebase Auth integration
- **Streaming Responses**: Real-time token streaming
- **Quick Actions**: Pre-configured prompts for common tasks
- **Context Loading**: Automatically loads project data for relevant responses

### Quick Actions
- **Format Script**: Script formatting and structure assistance
- **Breakdown Scene**: Production breakdown and element identification
- **Generate Shotlist**: Cinematography and shot planning

### Demo Pages
- **Assistant Demo**: `/assistant-demo` - Full-featured demo page
- **AI Test**: `/ai-test` - Basic API testing
- **Context Test**: `/context-test` - Test context loading functions
- **Prompt Test**: `/prompt-test` - Test prompt templates and JSON parsing
- **Service Integration Test**: `/service-integration-test` - Test complete AI to database workflow

See [AI_API_README.md](./AI_API_README.md) for detailed setup instructions.

## Environment Setup

For detailed environment configuration, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md).

## Deployment

For Vercel deployment instructions and environment variable setup, see [VERCEL_CHECKLIST.md](./docs/VERCEL_CHECKLIST.md).

## Building for Production

```bash
npm run build
```

## Support

For more information and support, please contact the development team.