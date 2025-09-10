// src/pages/diag.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Button 
} from '../components/ui/button';
import { 
  Badge 
} from '../components/ui/badge';
import { 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface EnvVar {
  key: string;
  value: string;
  masked: boolean;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const DiagnosticPage: React.FC = () => {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [nodeEnv, setNodeEnv] = useState<string>('');
  const [mode, setMode] = useState<string>('');
  const [showValues, setShowValues] = useState<boolean>(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Get all VITE_* environment variables
    const viteEnvVars: EnvVar[] = [];
    for (const key in import.meta.env) {
      if (key.startsWith('VITE_')) {
        viteEnvVars.push({
          key,
          value: import.meta.env[key] || '',
          masked: true
        });
      }
    }
    setEnvVars(viteEnvVars);

    // Get NODE_ENV and MODE
    setNodeEnv(import.meta.env.NODE_ENV || '');
    setMode(import.meta.env.MODE || '');

    // Get Firebase config
    const config: FirebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
    setFirebaseConfig(config);
  }, []);

  const toggleValueVisibility = (index: number) => {
    setEnvVars(prev => prev.map((env, i) => 
      i === index ? { ...env, masked: !env.masked } : env
    ));
  };

  const toggleAllValues = () => {
    setShowValues(!showValues);
    setEnvVars(prev => prev.map(env => ({ ...env, masked: showValues })));
  };

  const maskValue = (value: string): string => {
    if (!value) return '(empty)';
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '****' + value.substring(value.length - 2);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const generateDiagnosticReport = () => {
    const report = `# Scenius App Diagnostic Report
Generated: ${new Date().toISOString()}

## Environment Information
- NODE_ENV: ${nodeEnv}
- MODE: ${mode}

## Vite Environment Variables
${envVars.map(env => `${env.key}: ${env.masked ? maskValue(env.value) : env.value}`).join('\n')}

## Firebase Configuration
- API Key: ${firebaseConfig?.apiKey ? maskValue(firebaseConfig.apiKey) : 'Not set'}
- Auth Domain: ${firebaseConfig?.authDomain || 'Not set'}
- Project ID: ${firebaseConfig?.projectId || 'Not set'}
- Storage Bucket: ${firebaseConfig?.storageBucket || 'Not set'}
- Messaging Sender ID: ${firebaseConfig?.messagingSenderId || 'Not set'}
- App ID: ${firebaseConfig?.appId || 'Not set'}

## Browser Information
- User Agent: ${navigator.userAgent}
- Platform: ${navigator.platform}
- Language: ${navigator.language}
- Online: ${navigator.onLine}

## URL Information
- Current URL: ${window.location.href}
- Origin: ${window.location.origin}
- Pathname: ${window.location.pathname}
`;

    return report;
  };

  const copyFullReport = () => {
    const report = generateDiagnosticReport();
    copyToClipboard(report, 'report');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Diagnostics</h1>
        <div className="flex gap-2">
          <Button onClick={toggleAllValues} variant="outline">
            {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showValues ? 'Hide All Values' : 'Show All Values'}
          </Button>
          <Button onClick={copyFullReport}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Full Report
          </Button>
        </div>
      </div>

      {/* Environment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Environment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">NODE_ENV</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {nodeEnv || '(not set)'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">MODE</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {mode || '(not set)'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vite Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Vite Environment Variables
            <Badge variant="outline">{envVars.length} variables</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envVars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No VITE_* environment variables found
              </div>
            ) : (
              envVars.map((env, index) => (
                <div key={env.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{env.key}</div>
                    <div className="text-sm text-gray-600 font-mono">
                      {env.masked ? maskValue(env.value) : env.value || '(empty)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleValueVisibility(index)}
                    >
                      {env.masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(env.value, `env-${index}`)}
                    >
                      {copied === `env-${index}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Firebase Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Firebase Configuration
            {firebaseConfig?.projectId ? (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">API Key</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {firebaseConfig?.apiKey ? maskValue(firebaseConfig.apiKey) : '(not set)'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Auth Domain</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {firebaseConfig?.authDomain || '(not set)'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Project ID</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {firebaseConfig?.projectId || '(not set)'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Storage Bucket</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {firebaseConfig?.storageBucket || '(not set)'}
              </div>
              {firebaseConfig?.storageBucket && (
                <div className="mt-1 text-xs text-gray-500">
                  {firebaseConfig.storageBucket.endsWith('.firebasestorage.app') ? (
                    <span className="text-green-600">✓ Correct format (new projects)</span>
                  ) : firebaseConfig.storageBucket.endsWith('.appspot.com') ? (
                    <span className="text-blue-600">✓ Legacy format (older projects)</span>
                  ) : firebaseConfig.storageBucket.endsWith('.app') ? (
                    <span className="text-red-600">⚠ Should be .firebasestorage.app for new projects</span>
                  ) : (
                    <span className="text-gray-500">Unknown format</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Messaging Sender ID</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {firebaseConfig?.messagingSenderId || '(not set)'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">App ID</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {firebaseConfig?.appId || '(not set)'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Browser Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">User Agent</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                {navigator.userAgent}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Platform</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {navigator.platform}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Language</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {navigator.language}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Online Status</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {navigator.onLine ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            URL Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Current URL</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm break-all">
                {window.location.href}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Origin</label>
                <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                  {window.location.origin}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Pathname</label>
                <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                  {window.location.pathname}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage;
