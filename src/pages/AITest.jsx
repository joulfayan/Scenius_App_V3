import React from 'react';
import { ChatInterface } from '../components/ai/ChatInterface';

const AITestPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Chat Test</h1>
          <p className="text-gray-600">
            Test the AI chat functionality. Make sure your serverless function is deployed and configured.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Setup Required</h3>
          <p className="text-yellow-700 text-sm">
            To use this feature, you need to:
          </p>
          <ul className="list-disc list-inside text-yellow-700 text-sm mt-2 space-y-1">
            <li>Deploy the <code>api/ai.ts</code> serverless function</li>
            <li>Set up environment variables (OPENAI_API_KEY or OPENROUTER_API_KEY)</li>
            <li>Configure PROVIDER and MODEL environment variables</li>
            <li>Update VITE_AI_API_URL to point to your deployed function</li>
          </ul>
        </div>

        <ChatInterface 
          projectId="test-project"
          apiUrl={import.meta.env.VITE_AI_API_URL || '/api/ai'}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Usage Examples</h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p><strong>Script Analysis:</strong> "Analyze this script for pacing issues"</p>
            <p><strong>Character Development:</strong> "Help me develop this character's backstory"</p>
            <p><strong>Scene Writing:</strong> "Write a dialogue scene between two characters"</p>
            <p><strong>Production Planning:</strong> "What equipment do I need for this shot?"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestPage;
