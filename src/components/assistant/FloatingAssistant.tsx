import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { AssistantPanel } from '../../modules/assistant/AssistantPanel';

interface FloatingAssistantProps {
  projectId?: string;
  className?: string;
}

export function FloatingAssistant({ projectId, className }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={className}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="fixed bottom-4 right-4 z-50 w-96 h-[600px] shadow-xl">
          <CardContent className="p-0 h-full">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {!isMinimized && (
              <div className="h-[calc(100%-3rem)]">
                <AssistantPanel 
                  projectId={projectId}
                  className="h-full border-0 shadow-none"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FloatingAssistant;
