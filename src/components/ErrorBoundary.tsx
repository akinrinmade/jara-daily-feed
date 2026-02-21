import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[JaraDaily] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-black text-foreground mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-2">
              {this.state.error?.message?.includes('supabase') || this.state.error?.message?.includes('fetch')
                ? 'Could not connect to the server. Please check your internet connection and try again.'
                : 'An unexpected error occurred. Please refresh the page.'}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mb-6 font-mono bg-muted rounded px-2 py-1 break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-bold"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
