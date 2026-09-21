import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('Famly ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F9FA] dark:bg-[#0c1222] text-stone-900 dark:text-slate-100 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl font-black">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                {this.props.fallbackTitle || 'Hoppla! Ein kleiner Fehler ist aufgetreten'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Famly konnte diese Ansicht gerade nicht laden. Keine Sorge, deine Familiendaten sind sicher gespeichert.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-slate-800 text-[11px] font-mono text-stone-600 dark:text-slate-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="duo-btn duo-btn-green flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Seite neu laden</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="duo-btn duo-btn-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Erneut versuchen</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
