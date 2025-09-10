import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  FileText, 
  Camera, 
  List,
  Calendar,
  Loader2,
  CheckCircle,
  Copy
} from 'lucide-react';
import { 
  formatScriptPrompt, 
  breakdownPrompt, 
  shotlistPrompt, 
  callsheetPrompt,
  customPrompt,
  parseAIResponse
} from '../modules/assistant/prompts';

const PromptTest = () => {
  const [testInput, setTestInput] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResponse, setParsedResponse] = useState(null);

  const sampleScript = `FADE IN:

INT. COFFEE SHOP - MORNING

SARAH, 28, sits alone at a corner table, staring at her laptop screen. The coffee shop buzzes with morning activity.

SARAH
(to herself)
This can't be right...

She types frantically on her laptop, her brow furrowed in concentration.

JOHN, 30, approaches her table with a warm smile.

JOHN
Mind if I join you?

SARAH looks up, startled.

SARAH
Oh, uh, sure. I guess.

JOHN sits down across from her.

JOHN
You look like you're solving the world's problems.

SARAH
Something like that.

FADE OUT.`;

  const sampleScene = `Scene 1: INT. COFFEE SHOP - MORNING
Sarah sits at a corner table with her laptop, typing frantically. John approaches and asks to join her. They have a brief conversation about her work.

Scene 2: EXT. STREET - MORNING
Sarah and John walk together down the busy street, continuing their conversation about her mysterious project.`;

  const sampleDaySummary = `Shooting Day 1 - Coffee Shop Scene
- 2 scenes to shoot
- 2 main characters (Sarah, John)
- Interior location: Local coffee shop
- Exterior location: Busy street
- 8-hour shooting day
- Weather: Clear, 72°F`;

  const promptTests = [
    {
      id: 'format-script',
      label: 'Format Script',
      icon: <FileText className="h-4 w-4" />,
      sampleInput: sampleScript,
      generatePrompt: (input) => formatScriptPrompt(input, { format: 'json' })
    },
    {
      id: 'breakdown-scene',
      label: 'Breakdown Scene',
      icon: <List className="h-4 w-4" />,
      sampleInput: sampleScene,
      generatePrompt: (input) => breakdownPrompt(input, { format: 'json' })
    },
    {
      id: 'generate-shotlist',
      label: 'Generate Shotlist',
      icon: <Camera className="h-4 w-4" />,
      sampleInput: sampleScene,
      generatePrompt: (input) => shotlistPrompt(input, { format: 'json' })
    },
    {
      id: 'generate-callsheet',
      label: 'Generate Callsheet',
      icon: <Calendar className="h-4 w-4" />,
      sampleInput: sampleDaySummary,
      generatePrompt: (input) => callsheetPrompt(input, { format: 'json' })
    },
    {
      id: 'custom-prompt',
      label: 'Custom Prompt',
      icon: <FileText className="h-4 w-4" />,
      sampleInput: 'Help me plan a film production budget',
      generatePrompt: (input) => customPrompt('Project context here', input, { format: 'json' })
    }
  ];

  const handleTestPrompt = (test) => {
    setSelectedPrompt(test.id);
    setTestInput(test.sampleInput);
    setGeneratedPrompt('');
    setParsedResponse(null);
  };

  const generatePrompt = () => {
    if (!testInput.trim()) return;
    
    setIsLoading(true);
    try {
      const test = promptTests.find(t => t.id === selectedPrompt);
      if (test) {
        const prompt = test.generatePrompt(testInput);
        setGeneratedPrompt(prompt);
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testJSONParsing = () => {
    if (!generatedPrompt.trim()) return;
    
    try {
      // Simulate an AI response (in real usage, this would come from the AI)
      const mockResponse = `Here's the formatted result:

{
  "formattedScript": "FADE IN:\\n\\nINT. COFFEE SHOP - MORNING\\n\\nSARAH, 28, sits alone at a corner table...",
  "issues": [
    {
      "type": "formatting",
      "description": "Missing proper scene heading format",
      "suggestion": "Use INT./EXT. format",
      "line": 3
    }
  ],
  "improvements": [
    {
      "category": "dialogue",
      "description": "Dialogue could be more natural",
      "suggestion": "Add more conversational elements"
    }
  ],
  "summary": {
    "totalPages": 2,
    "estimatedDuration": 3,
    "characterCount": 150,
    "sceneCount": 1
  }
}`;
      
      const parsed = parseAIResponse(mockResponse);
      setParsedResponse(parsed);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prompt Templates Test</h1>
          <p className="text-gray-600">
            Test the AI assistant prompt templates and JSON response parsing.
          </p>
        </div>

        {/* Prompt Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Test Prompt Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {promptTests.map((test) => (
                <Button
                  key={test.id}
                  variant={selectedPrompt === test.id ? "default" : "outline"}
                  onClick={() => handleTestPrompt(test)}
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    {test.icon}
                    <div className="text-left">
                      <div className="font-medium">{test.label}</div>
                      <div className="text-xs text-gray-500">Click to test</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Input and Generation */}
        {selectedPrompt && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {promptTests.find(t => t.id === selectedPrompt)?.icon}
                  Input Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter your input text here..."
                  className="min-h-40"
                />
                <Button 
                  onClick={generatePrompt}
                  disabled={!testInput.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Prompt
                </Button>
              </CardContent>
            </Card>

            {/* Generated Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generated Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedPrompt ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Ready to send to AI</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedPrompt)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                      {generatedPrompt}
                    </pre>
                    <Button 
                      onClick={testJSONParsing}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Test JSON Parsing
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Click "Generate Prompt" to see the formatted prompt
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Parsed Response */}
        {parsedResponse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Parsed JSON Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-green-600">
                    Successfully Parsed
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(parsedResponse, null, 2))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-xs bg-green-50 p-3 rounded border overflow-auto max-h-60">
                  {JSON.stringify(parsedResponse, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">1. Select a Prompt Type</h4>
                <p className="text-sm text-gray-600">
                  Choose from the available prompt templates to test different AI assistant functions.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Modify Input Text</h4>
                <p className="text-sm text-gray-600">
                  Edit the sample input text or provide your own content to test with.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Generate Prompt</h4>
                <p className="text-sm text-gray-600">
                  Click "Generate Prompt" to see the formatted prompt that will be sent to the AI.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">4. Test JSON Parsing</h4>
                <p className="text-sm text-gray-600">
                  Test how the system parses structured JSON responses from the AI.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptTest;
