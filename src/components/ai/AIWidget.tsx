import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bot, MessageSquare, X } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

interface AIWidgetProps {
  projectId?: string;
  className?: string;
}

export function AIWidget({ projectId, className }: AIWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-lg"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="fixed bottom-4 right-4 z-50 w-96 h-[500px] shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4" />
                AI Assistant
                {projectId && (
                  <Badge variant="outline" className="text-xs">
                    {projectId}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-4rem)]">
            <ChatInterface 
              projectId={projectId}
              apiUrl={import.meta.env.VITE_AI_API_URL || '/api/ai'}
              className="h-full border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIWidget;
