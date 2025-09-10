import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  Database, 
  FileText, 
  Camera, 
  List,
  Calendar,
  Loader2,
  CheckCircle,
  X,
  Play
} from 'lucide-react';
import { 
  writeAIResult,
  validateAIResult
} from '../modules/assistant/serviceIntegration';

const ServiceIntegrationTest = () => {
  const [projectId, setProjectId] = useState('test-project');
  const [isWriting, setIsWriting] = useState(false);
  const [writeResults, setWriteResults] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');

  const mockResponses = {
    'format-script': {
      formattedScript: `FADE IN:\n\nINT. COFFEE SHOP - MORNING\n\nSARAH, 28, sits alone at a corner table, staring at her laptop screen. The coffee shop buzzes with morning activity.\n\nSARAH\n(to herself)\nThis can't be right...\n\nShe types frantically on her laptop, her brow furrowed in concentration.\n\nJOHN, 30, approaches her table with a warm smile.\n\nJOHN\nMind if I join you?\n\nSARAH looks up, startled.\n\nSARAH\nOh, uh, sure. I guess.\n\nJOHN sits down across from her.\n\nJOHN\nYou look like you're solving the world's problems.\n\nSARAH\nSomething like that.\n\nFADE OUT.`,
      issues: [
        {
          type: 'formatting',
          description: 'Missing proper scene heading format',
          suggestion: 'Use INT./EXT. format',
          line: 3
        }
      ],
      improvements: [
        {
          category: 'dialogue',
          description: 'Dialogue could be more natural',
          suggestion: 'Add more conversational elements'
        }
      ],
      summary: {
        totalPages: 2,
        estimatedDuration: 3,
        characterCount: 150,
        sceneCount: 1
      }
    },
    'breakdown-scene': {
      elements: [
        {
          type: 'prop',
          name: 'Laptop',
          description: 'Sarah\'s laptop computer',
          priority: 'high',
          estimatedCost: 0
        },
        {
          type: 'prop',
          name: 'Coffee Cup',
          description: 'Coffee cup on table',
          priority: 'medium',
          estimatedCost: 5
        }
      ],
      locations: [
        {
          name: 'Coffee Shop',
          type: 'interior',
          description: 'Busy coffee shop with tables and chairs',
          requirements: ['Tables', 'Chairs', 'Coffee equipment'],
          estimatedCost: 200
        }
      ],
      characters: [
        {
          name: 'Sarah',
          description: '28-year-old woman working on laptop',
          costume: ['Casual business attire'],
          props: ['Laptop', 'Coffee cup']
        },
        {
          name: 'John',
          description: '30-year-old man approaching table',
          costume: ['Casual clothing'],
          props: []
        }
      ],
      technical: {
        lighting: ['Natural lighting', 'Overhead lights'],
        sound: ['Ambient coffee shop noise'],
        camera: ['Handheld camera', 'Wide lens'],
        specialEffects: []
      },
      summary: {
        totalElements: 2,
        estimatedBudget: 205,
        complexity: 'low',
        specialRequirements: []
      }
    },
    'generate-shotlist': {
      shots: [
        {
          shotNumber: '1A',
          shotType: 'WIDE',
          angle: 'EYE_LEVEL',
          movement: 'STATIC',
          description: 'Wide shot of coffee shop interior',
          duration: 5,
          characters: ['Sarah'],
          props: ['Laptop', 'Coffee cup'],
          location: 'Coffee Shop',
          lighting: 'Natural lighting',
          camera: {
            lens: '24mm',
            settings: 'f/2.8, 1/60s, ISO 400',
            filters: []
          },
          notes: 'Establish location',
          difficulty: 'easy',
          estimatedTime: 10
        },
        {
          shotNumber: '1B',
          shotType: 'CLOSE',
          angle: 'EYE_LEVEL',
          movement: 'STATIC',
          description: 'Close-up of Sarah typing on laptop',
          duration: 3,
          characters: ['Sarah'],
          props: ['Laptop'],
          location: 'Coffee Shop',
          lighting: 'Natural lighting',
          camera: {
            lens: '85mm',
            settings: 'f/2.8, 1/60s, ISO 400',
            filters: []
          },
          notes: 'Show concentration',
          difficulty: 'easy',
          estimatedTime: 5
        }
      ],
      coverage: {
        totalShots: 2,
        estimatedDuration: 8,
        complexity: 'low',
        specialEquipment: []
      },
      schedule: {
        estimatedDays: 1,
        dailyShots: [2],
        priority: ['must_have', 'must_have']
      }
    },
    'generate-callsheet': {
      production: {
        title: 'Coffee Shop Scene',
        date: '2024-01-15',
        day: 1,
        weather: 'Clear, 72°F',
        sunrise: '07:00',
        sunset: '18:00'
      },
      schedule: {
        callTime: '08:00',
        wrapTime: '17:00',
        lunchTime: '12:00',
        totalHours: 9
      },
      locations: [
        {
          name: 'Downtown Coffee Shop',
          address: '123 Main St, City, State',
          contact: 'Manager: (555) 123-4567',
          callTime: '08:00',
          wrapTime: '17:00',
          notes: 'Permission obtained'
        }
      ],
      cast: [
        {
          name: 'Sarah Johnson',
          character: 'Sarah',
          callTime: '08:30',
          costume: 'Casual business attire',
          makeup: 'Natural',
          notes: 'Lead actress'
        },
        {
          name: 'John Smith',
          character: 'John',
          callTime: '09:00',
          costume: 'Casual clothing',
          makeup: 'Natural',
          notes: 'Supporting actor'
        }
      ],
      crew: [
        {
          name: 'Director',
          position: 'Director',
          callTime: '08:00',
          contact: '(555) 111-1111',
          notes: 'On set director'
        },
        {
          name: 'DP',
          position: 'Director of Photography',
          callTime: '08:00',
          contact: '(555) 222-2222',
          notes: 'Camera department'
        }
      ],
      equipment: {
        camera: ['RED Komodo', '24mm lens', '85mm lens'],
        lighting: ['LED panels', 'Reflectors'],
        sound: ['Boom mic', 'Wireless lavs'],
        grip: ['Tripod', 'Slider'],
        special: []
      },
      transportation: [
        {
          type: 'Van',
          capacity: 8,
          driver: 'Transport Driver',
          contact: '(555) 333-3333',
          notes: 'Equipment transport'
        }
      ],
      meals: {
        breakfast: 'Craft services at 08:00',
        lunch: 'Catered lunch at 12:00',
        dinner: 'Wrap dinner at 17:00',
        craftServices: 'Available all day'
      },
      safety: {
        hazards: ['Electrical equipment', 'Hot coffee'],
        precautions: ['Safety briefing', 'Fire extinguisher nearby'],
        emergencyContacts: [
          {
            name: 'Safety Officer',
            position: 'Safety',
            phone: '(555) 444-4444'
          }
        ]
      },
      notes: ['Weather backup plan', 'Parking arrangements', 'Quiet hours respected']
    }
  };

  const testActions = [
    {
      id: 'format-script',
      label: 'Format Script',
      icon: <FileText className="h-4 w-4" />,
      description: 'Test script formatting and saving'
    },
    {
      id: 'breakdown-scene',
      label: 'Breakdown Scene',
      icon: <List className="h-4 w-4" />,
      description: 'Test scene breakdown and element creation'
    },
    {
      id: 'generate-shotlist',
      label: 'Generate Shotlist',
      icon: <Camera className="h-4 w-4" />,
      description: 'Test shotlist generation and equipment creation'
    },
    {
      id: 'generate-callsheet',
      label: 'Generate Callsheet',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Test callsheet generation and creation'
    }
  ];

  const runTest = async (actionId) => {
    setSelectedAction(actionId);
    setIsWriting(true);
    
    try {
      const mockResponse = mockResponses[actionId];
      if (!mockResponse) {
        throw new Error('No mock response available for this action');
      }

      // Validate the response first
      const isValid = validateAIResult(actionId, mockResponse);
      if (!isValid) {
        throw new Error('Mock response validation failed');
      }

      // Write to services
      const result = await writeAIResult(actionId, mockResponse, {
        projectId,
        scriptId: 'test-script',
        sceneId: 'test-scene',
        elementId: 'test-element',
        callsheetId: 'test-callsheet'
      });

      setWriteResults(prev => [...prev, { ...result, actionId, timestamp: new Date() }]);
    } catch (error) {
      console.error('Test failed:', error);
      setWriteResults(prev => [...prev, {
        success: false,
        message: 'Test failed',
        error: error.message,
        actionId,
        timestamp: new Date()
      }]);
    } finally {
      setIsWriting(false);
    }
  };

  const clearResults = () => {
    setWriteResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Service Integration Test</h1>
          <p className="text-gray-600">
            Test the complete workflow from AI response parsing to database writing.
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="test-project"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testActions.map((action) => (
                <Button
                  key={action.id}
                  onClick={() => runTest(action.id)}
                  disabled={isWriting}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center gap-3">
                    {action.icon}
                    <div className="text-left">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                    {isWriting && selectedAction === action.id && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={clearResults} variant="outline" size="sm">
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {writeResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            
            {writeResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {testActions.find(a => a.id === result.actionId)?.icon}
                    {testActions.find(a => a.id === result.actionId)?.label}
                    <Badge variant={result.success ? "outline" : "destructive"}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-sm text-gray-500 ml-auto">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{result.message}</p>
                  
                  {result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                  
                  {result.data && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Created Data:</h4>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">1. Set Project ID</h4>
                <p className="text-sm text-gray-600">
                  Enter a valid project ID that exists in your Firebase database.
                  Use "test-project" for testing with mock data.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Run Tests</h4>
                <p className="text-sm text-gray-600">
                  Click on any test action to run the complete workflow from
                  AI response parsing to database writing.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Check Results</h4>
                <p className="text-sm text-gray-600">
                  Review the test results to see what data was created
                  and any errors that occurred.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">4. Verify in Database</h4>
                <p className="text-sm text-gray-600">
                  Check your Firebase database to verify that the data
                  was actually written to the appropriate collections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServiceIntegrationTest;
