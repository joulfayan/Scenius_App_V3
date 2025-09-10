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
  Loader2,
  CheckCircle
} from 'lucide-react';
import { 
  getScriptExcerpt, 
  getScenesSummary, 
  getCatalogSummary,
  getProjectContext,
  formatProjectContext
} from '../modules/assistant/contextLoaders';

const ContextTest = () => {
  const [projectId, setProjectId] = useState('test-project');
  const [scriptId, setScriptId] = useState('test-script');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const [formattedContext, setFormattedContext] = useState('');

  const testScriptExcerpt = async () => {
    setIsLoading(true);
    try {
      const result = await getScriptExcerpt(projectId, scriptId, { maxChars: 500 });
      setResults(prev => ({ ...prev, scriptExcerpt: result }));
    } catch (error) {
      console.error('Script excerpt error:', error);
      setResults(prev => ({ ...prev, scriptExcerpt: { error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };

  const testScenesSummary = async () => {
    setIsLoading(true);
    try {
      const result = await getScenesSummary(projectId, { limit: 5 });
      setResults(prev => ({ ...prev, scenesSummary: result }));
    } catch (error) {
      console.error('Scenes summary error:', error);
      setResults(prev => ({ ...prev, scenesSummary: { error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };

  const testCatalogSummary = async () => {
    setIsLoading(true);
    try {
      const result = await getCatalogSummary(projectId, { limit: 10 });
      setResults(prev => ({ ...prev, catalogSummary: result }));
    } catch (error) {
      console.error('Catalog summary error:', error);
      setResults(prev => ({ ...prev, catalogSummary: { error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };

  const testFullContext = async () => {
    setIsLoading(true);
    try {
      const context = await getProjectContext(projectId, {
        scriptId,
        maxScriptChars: 1000,
        scenesLimit: 5,
        catalogLimit: 10
      });
      const formatted = formatProjectContext(context);
      setResults(prev => ({ ...prev, fullContext: context }));
      setFormattedContext(formatted);
    } catch (error) {
      console.error('Full context error:', error);
      setResults(prev => ({ ...prev, fullContext: { error: error.message } }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults({});
    setFormattedContext('');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Context Loaders Test</h1>
          <p className="text-gray-600">
            Test the context loading functions for the AI Assistant.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="text-sm font-medium text-gray-700">Script ID</label>
                <input
                  type="text"
                  value={scriptId}
                  onChange={(e) => setScriptId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="test-script"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={testScriptExcerpt}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Test Script Excerpt
              </Button>
              
              <Button
                onClick={testScenesSummary}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <List className="h-4 w-4 mr-2" />
                Test Scenes Summary
              </Button>
              
              <Button
                onClick={testCatalogSummary}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Test Catalog Summary
              </Button>
              
              <Button
                onClick={testFullContext}
                disabled={isLoading}
                variant="default"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Test Full Context
              </Button>
              
              <Button
                onClick={clearResults}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            
            {results.scriptExcerpt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Script Excerpt
                    {results.scriptExcerpt.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="outline">Success</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(results.scriptExcerpt, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {results.scenesSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Scenes Summary
                    {results.scenesSummary.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="outline">Success</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(results.scenesSummary, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {results.catalogSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Catalog Summary
                    {results.catalogSummary.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="outline">Success</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(results.catalogSummary, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {results.fullContext && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Full Context
                    {results.fullContext.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="outline">Success</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(results.fullContext, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Formatted Context */}
        {formattedContext && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Formatted Context for AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formattedContext}
                readOnly
                className="min-h-40 font-mono text-sm"
              />
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
                <h4 className="font-medium mb-2">1. Set Project ID</h4>
                <p className="text-sm text-gray-600">
                  Enter a valid project ID that exists in your Firebase database.
                  Use "test-project" for testing with mock data.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Test Individual Functions</h4>
                <p className="text-sm text-gray-600">
                  Test each context loader function individually to see what data
                  they return and how they handle errors.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Test Full Context</h4>
                <p className="text-sm text-gray-600">
                  Test the complete context loading and formatting to see how
                  the data is prepared for the AI assistant.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">4. Check Formatted Output</h4>
                <p className="text-sm text-gray-600">
                  The formatted context shows exactly what will be sent to the
                  AI assistant as system prompt context.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContextTest;
