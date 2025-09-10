// src/app/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
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
  Alert, 
  AlertDescription 
} from '../components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showStack: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false
    });
  };

  handleCopyError = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    };

    const errorText = `Error Details:
Message: ${errorDetails.message}
Stack: ${errorDetails.stack}
Component Stack: ${errorDetails.componentStack}
Timestamp: ${errorDetails.timestamp}`;

    navigator.clipboard.writeText(errorText).then(() => {
      // You could add a toast notification here
      console.log('Error details copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy error details:', err);
    });
  };

  toggleStack = () => {
    this.setState(prevState => ({
      showStack: !prevState.showStack
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </AlertDescription>
              </Alert>

              {this.state.error && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Error Message:</h3>
                    <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                      {this.state.error.message}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={this.toggleStack}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      {this.state.showStack ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Stack Trace
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show Stack Trace
                        </>
                      )}
                    </button>

                    {this.state.showStack && (
                      <div className="mt-2 space-y-3">
                        {this.state.error.stack && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Error Stack:</h4>
                            <div className="bg-gray-100 p-3 rounded-md font-mono text-xs overflow-auto max-h-40">
                              <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                            </div>
                          </div>
                        )}

                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Component Stack:</h4>
                            <div className="bg-gray-100 p-3 rounded-md font-mono text-xs overflow-auto max-h-40">
                              <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleCopyError}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Error Details
                </Button>
              </div>

              <div className="text-sm text-gray-600 pt-2 border-t">
                <p>
                  If this error persists, please contact support with the error details above.
                  The error has been logged to the browser console for debugging.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
