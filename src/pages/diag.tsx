import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DiagPage() {
  // Get all VITE_ environment variables
  const viteEnvVars = Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .sort()
    .map(key => ({
      key,
      value: import.meta.env[key],
      masked: maskValue(import.meta.env[key])
    }));

  // Get server-side environment variables (these will be undefined in browser)
  const serverEnvVars = [
    { key: 'MODEL', value: import.meta.env.MODEL, masked: maskValue(import.meta.env.MODEL) },
    { key: 'PROVIDER', value: import.meta.env.PROVIDER, masked: maskValue(import.meta.env.PROVIDER) }
  ];

  // Get build information
  const buildInfo = {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    base: import.meta.env.BASE_URL,
    version: import.meta.env.VITE_APP_VERSION || 'Not set'
  };

  // Get browser information
  const browserInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      build: buildInfo,
      environment: {
        vite: viteEnvVars,
        server: serverEnvVars
      },
      browser: browserInfo,
      runtime: {
        build: 'Vite',
        functions: 'nodejs20.x'
      }
    };
    
    return JSON.stringify(report, null, 2);
  };

  const copyReport = () => {
    copyToClipboard(generateReport());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scenius App Diagnostic</h1>
          <p className="text-gray-600">Environment configuration and system information</p>
        </div>

        {/* Build Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Build Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Build System:</span>
                <Badge variant="secondary" className="ml-2">Vite</Badge>
              </div>
              <div>
                <span className="font-medium">Functions Runtime:</span>
                <Badge variant="secondary" className="ml-2">nodejs20.x</Badge>
              </div>
              <div>
                <span className="font-medium">Mode:</span>
                <Badge variant={buildInfo.dev ? "destructive" : "default"} className="ml-2">
                  {buildInfo.mode}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Base URL:</span>
                <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">{buildInfo.base}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VITE_ Environment Variables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              VITE_ Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viteEnvVars.length > 0 ? (
              <div className="space-y-3">
                {viteEnvVars.map(({ key, value, masked }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <code className="font-mono text-sm font-medium text-blue-600">{key}</code>
                      <div className="text-sm text-gray-600 mt-1">
                        {value ? (
                          <span className="text-green-600">✓ Set</span>
                        ) : (
                          <span className="text-red-600">✗ Not set</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <code className="font-mono text-sm text-gray-500">{masked}</code>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p>No VITE_ environment variables found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server Environment Variables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              Server Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serverEnvVars.map(({ key, value, masked }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <code className="font-mono text-sm font-medium text-orange-600">{key}</code>
                    <div className="text-sm text-gray-600 mt-1">
                      {value ? (
                        <span className="text-green-600">✓ Available</span>
                      ) : (
                        <span className="text-red-600">✗ Not available (server-side only)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <code className="font-mono text-sm text-gray-500">{masked}</code>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Server environment variables are not accessible in the browser. 
                They are only available in Vercel functions and build processes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Browser Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              Browser Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Platform:</span>
                <code className="ml-2 text-sm">{browserInfo.platform}</code>
              </div>
              <div>
                <span className="font-medium">Language:</span>
                <code className="ml-2 text-sm">{browserInfo.language}</code>
              </div>
              <div>
                <span className="font-medium">Online:</span>
                <Badge variant={browserInfo.online ? "default" : "destructive"} className="ml-2">
                  {browserInfo.online ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Cookies:</span>
                <Badge variant={browserInfo.cookieEnabled ? "default" : "destructive"} className="ml-2">
                  {browserInfo.cookieEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <span className="font-medium">User Agent:</span>
              <code className="block text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                {browserInfo.userAgent}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Generate a complete diagnostic report that can be shared for troubleshooting.
            </p>
            <Button onClick={copyReport} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Diagnostic Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to mask sensitive values
function maskValue(value: string | undefined): string {
  if (!value) return 'Not set';
  if (value.length <= 4) return '***';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}