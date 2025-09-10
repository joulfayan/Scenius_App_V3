# Environment Setup Guide

## Firebase Configuration

This application requires Firebase environment variables to be configured. Create a `.env.local` file in the project root with the following variables:

```env
# Firebase Configuration
# Get these values from your Firebase Console > Project Settings > General > Your apps
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
VITE_FIREBASE_APP_ID=your-app-id-here

# AI API Configuration
VITE_AI_API_URL=http://localhost:3001/api/ai  # For development with Vercel dev
```

## AI API Configuration

The application includes an AI chat feature that requires additional environment variables for the serverless function:

### Required Environment Variables (for serverless deployment)

```env
# AI Provider Configuration
PROVIDER=openai  # or "openrouter"
MODEL=gpt-4o-mini  # or "gpt-4.1-mini" for OpenRouter

# API Keys (choose one based on provider)
OPENAI_API_KEY=your-openai-api-key-here
# OR
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

### Provider Options

**OpenAI (Default)**
- Set `PROVIDER=openai`
- Set `OPENAI_API_KEY=your-key`
- Models: `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`

**OpenRouter**
- Set `PROVIDER=openrouter`
- Set `OPENROUTER_API_KEY=your-key`
- Models: `gpt-4o-mini`, `gpt-4.1-mini`, `claude-3-sonnet`, etc.

## Important: Storage Bucket Format

**For projects created after October 30, 2024:**
- Use the format: `PROJECT_ID.firebasestorage.app`
- Do NOT use the old format: `PROJECT_ID.appspot.com`

**For older projects:**
- You may still use: `PROJECT_ID.appspot.com`

## How to Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on your web app or create one if it doesn't exist
6. Copy the configuration values

## Storage Bucket Check

To verify your storage bucket format:
1. In Firebase Console, go to Storage
2. Check the bucket name in the URL or settings
3. If it ends with `.app` but not `.firebasestorage.app`, update your environment variable

## Error Handling

If you see environment variable errors:
1. Check that your `.env.local` file exists in the project root
2. Verify all required variables are set
3. Ensure the storage bucket format is correct
4. Restart your development server after making changes

The application will show helpful error messages if any configuration is missing or incorrect.

## Deployment

For production deployment on Vercel, see [VERCEL_CHECKLIST.md](./docs/VERCEL_CHECKLIST.md) for:
- Complete environment variable setup instructions
- Vercel-specific configuration steps
- Validation using the diagnostic page (`/diag`)
- Troubleshooting common deployment issues
