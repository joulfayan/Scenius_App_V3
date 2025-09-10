# Vercel Deployment Checklist

This document provides a comprehensive checklist for deploying the Scenius App to Vercel, including all required environment variables and validation steps.

## Prerequisites

- Vercel account with project access
- Firebase project configured
- OpenAI or OpenRouter API key (for AI features)

## Environment Variables Setup

### 1. Navigate to Vercel Project Settings

1. Go to your Vercel dashboard
2. Select your Scenius App project
3. Navigate to **Settings** → **Environment Variables**

### 2. Required Firebase Environment Variables

Set the following environment variables with the `VITE_` prefix (these are client-side variables):

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.appspot.com` or `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789012:web:abcdef123456` |

**Note:** The `VITE_` prefix is required for Vite to expose these variables to the client-side code.

### 3. AI Service Environment Variables

Set **one** of the following API key variables (server-side only, no `VITE_` prefix):

| Variable Name | Description | When to Use |
|---------------|-------------|-------------|
| `OPENAI_API_KEY` | OpenAI API Key | For direct OpenAI integration |
| `OPENROUTER_API_KEY` | OpenRouter API Key | For OpenRouter proxy service |

### 4. Optional AI Configuration Variables

These variables are optional and provide defaults for AI service configuration:

| Variable Name | Description | Default Values | Example |
|---------------|-------------|----------------|---------|
| `MODEL` | AI Model to use | `gpt-4o-mini` | `gpt-4o`, `claude-3-5-sonnet-20241022` |
| `PROVIDER` | AI Provider | `openai` | `openai`, `anthropic`, `openrouter` |

## Environment Variable Configuration

### Setting Variables in Vercel

1. **For each environment variable:**
   - Click **Add New**
   - Enter the variable name (exactly as shown above)
   - Enter the variable value
   - Select the appropriate environments:
     - **Production** (for live deployment)
     - **Preview** (for preview deployments)
     - **Development** (for local development)

2. **Important Notes:**
   - Firebase variables need `VITE_` prefix and should be available in all environments
   - AI API keys should be **server-side only** (no `VITE_` prefix)
   - AI configuration variables are optional but recommended

### Getting Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → **Web**
6. Copy the configuration values from the Firebase config object

Example Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",                    // → VITE_FIREBASE_API_KEY
  authDomain: "project.firebaseapp.com",   // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id",            // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "project.appspot.com",    // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789012",       // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789012:web:abcdef123456" // → VITE_FIREBASE_APP_ID
};
```

## Validation and Testing

### 1. Diagnostic Page

After deployment, visit the diagnostic page to verify your configuration:

**URL:** `https://your-app.vercel.app/diag`

This page will show:
- ✅ All environment variables status
- ✅ Firebase configuration validation
- ✅ Browser and system information
- ✅ Copy diagnostic report functionality

### 2. What to Check

The diagnostic page will display:

1. **Environment Information**
   - NODE_ENV and MODE values
   - All VITE_* variables with masked values

2. **Firebase Configuration**
   - All Firebase variables with validation status
   - Storage bucket format validation
   - Configuration completeness indicator

3. **Browser Information**
   - User agent and platform details
   - Online status and language settings

### 3. Common Issues

| Issue | Solution |
|-------|----------|
| Firebase variables not showing | Ensure `VITE_` prefix is used |
| AI features not working | Check API key is set without `VITE_` prefix |
| Storage bucket format warning | Use `.firebasestorage.app` for new projects |
| Variables showing as "not set" | Redeploy after adding variables |

## Deployment Steps

1. **Set Environment Variables** (as described above)
2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```
   Or push to your connected Git repository
3. **Verify Deployment:**
   - Visit your app URL
   - Navigate to `/diag` to check configuration
   - Test Firebase authentication
   - Test AI features (if configured)

## Troubleshooting

### Environment Variables Not Loading

1. **Check Variable Names:** Ensure exact spelling and case
2. **Check Prefixes:** Firebase vars need `VITE_`, API keys should NOT have `VITE_`
3. **Redeploy:** Environment variables require a new deployment
4. **Check Environment Scope:** Ensure variables are enabled for the correct environments

### Firebase Connection Issues

1. **Verify Project ID:** Must match exactly
2. **Check Auth Domain:** Should be `project-id.firebaseapp.com`
3. **Storage Bucket:** Use the correct format for your Firebase project version
4. **API Key:** Must be the Web API key, not server key

### AI Service Issues

1. **API Key:** Ensure it's set without `VITE_` prefix
2. **Provider:** Check if using correct provider (OpenAI vs OpenRouter)
3. **Model:** Verify model name is supported by your provider
4. **Rate Limits:** Check API key has sufficient credits/rate limits

## Security Notes

- **Never** commit environment variables to version control
- **Client-side variables** (with `VITE_` prefix) are visible in the browser
- **Server-side variables** (without `VITE_` prefix) are only accessible on the server
- **API keys** should always be server-side only
- **Firebase config** is safe to expose client-side (it's designed for this)

## Support

If you encounter issues:

1. Check the diagnostic page first: `/diag`
2. Review this checklist for common solutions
3. Check Vercel deployment logs
4. Verify Firebase project configuration
5. Test API keys independently

---

**Last Updated:** $(date)
**App Version:** Scenius App V3
