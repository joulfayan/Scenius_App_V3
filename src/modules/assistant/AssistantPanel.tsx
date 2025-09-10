import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  FileText, 
  Camera, 
  List,
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { auth } from '../../lib/firebase.client';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ChatMessage } from '../../lib/ai-client';
import { getProjectContext, formatProjectContext } from './contextLoaders';
import { 
  formatScriptPrompt, 
  breakdownPrompt, 
  shotlistPrompt, 
  callsheetPrompt,
  parseAIResponse,
  type ScriptFormatResult,
  type BreakdownResult,
  type ShotlistResult,
  type CallsheetResult
} from './prompts';
import { 
  writeAIResult, 
  validateAIResult,
  type ServiceWriteResult 
} from './serviceIntegration';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  systemPrompt: string;
  description: string;
}

interface AssistantPanelProps {
  projectId?: string;
  className?: string;
  onClose?: () => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'format-script',
    label: 'Format Script',
    icon: <FileText className="h-4 w-4" />,
    systemPrompt: 'You are a professional script formatter. Help format and improve script formatting, structure, and industry standards.',
    description: 'Format and improve script structure'
  },
  {
    id: 'breakdown-scene',
    label: 'Breakdown Scene',
    icon: <List className="h-4 w-4" />,
    systemPrompt: 'You are a production assistant. Help break down scenes into production elements, identify props, locations, characters, and technical requirements.',
    description: 'Break down scenes for production'
  },
  {
    id: 'generate-shotlist',
    label: 'Generate Shotlist',
    icon: <Camera className="h-4 w-4" />,
    systemPrompt: 'You are a cinematography expert. Help create detailed shot lists with camera angles, movements, and technical specifications.',
    description: 'Create detailed shot lists'
  },
  {
    id: 'generate-callsheet',
    label: 'Generate Callsheet',
    icon: <FileText className="h-4 w-4" />,
    systemPrompt: 'You are a production coordinator. Help create detailed callsheets with schedules, contacts, and production requirements.',
    description: 'Create production callsheets'
  }
];

export function AssistantPanel({ projectId, className, onClose }: AssistantPanelProps) {
  const [user, loading, error] = useAuthState(auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [selectedQuickAction, setSelectedQuickAction] = useState<QuickAction | null>(null);
  const [projectContext, setProjectContext] = useState<string>('');
  const [structuredResponse, setStructuredResponse] = useState<any>(null);
  const [isValidJSON, setIsValidJSON] = useState<boolean>(false);
  const [isWritingToService, setIsWritingToService] = useState<boolean>(false);
  const [writeResult, setWriteResult] = useState<ServiceWriteResult | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, currentResponse]);

  // Handle quick action selection
  const handleQuickAction = async (action: QuickAction) => {
    setSelectedQuickAction(action);
    
    // Load project context for quick actions
    if (projectId) {
      setIsLoadingContext(true);
      try {
        const context = await getProjectContext(projectId, {
          scenesLimit: 5,
          catalogLimit: 10
        });
        const formattedContext = formatProjectContext(context);
        setProjectContext(formattedContext);
        
        // Generate specialized prompt based on action
        let specializedPrompt = '';
        switch (action.id) {
          case 'format-script':
            if (context.script) {
              specializedPrompt = formatScriptPrompt(context.script.excerpt, { format: 'json' });
            } else {
              specializedPrompt = `Please provide a script excerpt to format. ${action.description}`;
            }
            break;
          case 'breakdown-scene':
            if (context.scenes.length > 0) {
              const sceneText = context.scenes.map(s => `Scene ${s.number}: ${s.heading}`).join('\n');
              specializedPrompt = breakdownPrompt(sceneText, { format: 'json' });
            } else {
              specializedPrompt = `Please provide scene text to break down. ${action.description}`;
            }
            break;
          case 'generate-shotlist':
            if (context.scenes.length > 0) {
              const sceneText = context.scenes.map(s => `Scene ${s.number}: ${s.heading}`).join('\n');
              specializedPrompt = shotlistPrompt(sceneText, { format: 'json' });
            } else {
              specializedPrompt = `Please provide scene text for shotlist generation. ${action.description}`;
            }
            break;
          case 'generate-callsheet':
            const daySummary = `Shooting day for project: ${context.project?.name || 'Unknown'}\nScenes: ${context.scenes.length}\nElements: ${context.catalog.totalElements}`;
            specializedPrompt = callsheetPrompt(daySummary, { format: 'json' });
            break;
          default:
            specializedPrompt = `Please help me with: ${action.description}`;
        }
        
        setInput(specializedPrompt);
      } catch (error) {
        console.error('Error loading project context:', error);
        setProjectContext('');
        setInput(`Please help me with: ${action.description}`);
      } finally {
        setIsLoadingContext(false);
      }
    } else {
      setInput(`Please help me with: ${action.description}`);
    }
  };

  // Send message with streaming
  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    let newMessages = [...messages, userMessage];
    
    // Add system prompt if quick action is selected
    if (selectedQuickAction) {
      let systemContent = selectedQuickAction.systemPrompt;
      
      // Add project context if available
      if (projectContext) {
        systemContent += '\n\n' + projectContext;
      }
      
      newMessages = [
        {
          role: 'system',
          content: systemContent
        },
        ...newMessages
      ];
    }

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');
    setSelectedQuickAction(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(import.meta.env.VITE_AI_API_URL || 'http://localhost:3001/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          projectId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: fullContent,
                  },
                ]);
                setCurrentResponse('');
                setIsLoading(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  setCurrentResponse(fullContent);
                  
                  // Try to parse structured response for quick actions
                  if (selectedQuickAction && fullContent.includes('{')) {
                    const structured = parseAIResponse(fullContent);
                    if (structured) {
                      setStructuredResponse(structured);
                      const isValid = validateAIResult(selectedQuickAction.id, structured);
                      setIsValidJSON(isValid);
                    }
                  }
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
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
      setCurrentResponse('');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse('');
    setSelectedQuickAction(null);
    setStructuredResponse(null);
    setIsValidJSON(false);
    setWriteResult(null);
  };

  // Apply JSON result to services
  const applyJSONResult = async () => {
    if (!structuredResponse || !selectedQuickAction || !projectId || !isValidJSON) {
      return;
    }

    setIsWritingToService(true);
    setWriteResult(null);

    try {
      const result = await writeAIResult(selectedQuickAction.id, structuredResponse, {
        projectId,
        scriptId: 'ai-generated', // This should be determined by context
        sceneId: 'ai-generated',
        elementId: 'ai-generated',
        callsheetId: 'ai-generated'
      });

      setWriteResult(result);
    } catch (error) {
      console.error('Error applying JSON result:', error);
      setWriteResult({
        success: false,
        message: 'Failed to apply result to services',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsWritingToService(false);
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setCurrentResponse('');
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show login prompt if not authenticated
  if (error || !user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <Bot className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-900">Authentication Required</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please log in to use the AI Assistant
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Assistant
            {projectId && (
              <Badge variant="outline" className="text-xs">
                {projectId}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Quick Actions
            {isLoadingContext && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            )}
            {projectContext && !isLoadingContext && (
              <Badge variant="outline" className="text-xs text-green-600">
                Context Loaded
              </Badge>
            )}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant={selectedQuickAction?.id === action.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickAction(action)}
                className="justify-start h-auto p-3"
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Chat History */}
        <ScrollArea ref={scrollAreaRef} className="h-64 w-full">
          <div className="space-y-4 pr-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Start a conversation with the AI assistant</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use quick actions above or type your message below
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && currentResponse && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                    <p className="whitespace-pre-wrap text-sm">
                      {currentResponse}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Structured Response Display */}
            {structuredResponse && selectedQuickAction && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isValidJSON ? 'bg-green-200 text-green-600' : 'bg-yellow-200 text-yellow-600'
                  }`}>
                    {isValidJSON ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-4 py-2 border text-gray-900 ${
                    isValidJSON ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${
                          isValidJSON ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {selectedQuickAction.label} Result
                          {isValidJSON ? ' (Valid JSON)' : ' (Invalid JSON)'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStructuredResponse(null)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(structuredResponse, null, 2)}
                      </pre>
                      {isValidJSON && (
                        <div className="flex gap-2">
                          <Button
                            onClick={applyJSONResult}
                            disabled={isWritingToService}
                            size="sm"
                            className="text-xs"
                          >
                            {isWritingToService ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              'Apply to Project'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Write Result */}
            {writeResult && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[90%]">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    writeResult.success ? 'bg-green-200 text-green-600' : 'bg-red-200 text-red-600'
                  }`}>
                    {writeResult.success ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-4 py-2 border text-gray-900 ${
                    writeResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${
                          writeResult.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {writeResult.success ? 'Applied Successfully' : 'Application Failed'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWriteResult(null)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm">{writeResult.message}</p>
                      {writeResult.error && (
                        <p className="text-xs text-red-600">{writeResult.error}</p>
                      )}
                      {writeResult.data && (
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {JSON.stringify(writeResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[60px] text-sm"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <Button
                  onClick={cancelRequest}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="h-8"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0}
                className="h-6 text-xs"
              >
                Clear Chat
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AssistantPanel;
