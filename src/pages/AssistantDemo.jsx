import React, { useState } from 'react';
import { AssistantPanel } from '../modules/assistant/AssistantPanel';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { MessageSquare, X } from 'lucide-react';

const AssistantDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Assistant Demo</h1>
          <p className="text-gray-600">
            Test the AI Assistant with authentication, streaming responses, and quick actions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demo Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Demo Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Features to Test:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Firebase Authentication (login required)</li>
                  <li>• Streaming AI responses</li>
                  <li>• Quick action buttons</li>
                  <li>• Chat history management</li>
                  <li>• Real-time token streaming</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Format Script:</strong> Script formatting assistance</li>
                  <li>• <strong>Breakdown Scene:</strong> Production breakdown help</li>
                  <li>• <strong>Generate Shotlist:</strong> Cinematography assistance</li>
                </ul>
              </div>

              <Button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full"
              >
                {isOpen ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Close Assistant
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Assistant
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Assistant Panel */}
          <div className="lg:col-span-1">
            {isOpen ? (
              <AssistantPanel 
                projectId="demo-project"
                onClose={() => setIsOpen(false)}
              />
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Click "Open Assistant" to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">1. Authentication</h4>
                <p className="text-sm text-gray-600">
                  You'll need to be logged in with Firebase Auth to use the assistant.
                  The panel will show a login prompt if you're not authenticated.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Quick Actions</h4>
                <p className="text-sm text-gray-600">
                  Click any quick action button to prepopulate the input with a system prompt
                  and context-specific instructions for that task.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Streaming Responses</h4>
                <p className="text-sm text-gray-600">
                  Watch as the AI response streams in real-time, token by token.
                  You can cancel requests in progress.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">4. Chat History</h4>
                <p className="text-sm text-gray-600">
                  All messages are stored in the chat history. You can clear the chat
                  and start fresh at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssistantDemo;
