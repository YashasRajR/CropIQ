import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-rose-500/40 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected interface error occurred. You can reload this view to restore the dashboard state.
            </p>
            {this.state.error && (
              <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg text-rose-300 overflow-x-auto mb-6 text-left border border-slate-800">
                {this.state.error.message}
              </pre>
            )}
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={this.handleReset}
              className="w-full"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
