import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
            <p className="text-sm text-gray-500">{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700">
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
