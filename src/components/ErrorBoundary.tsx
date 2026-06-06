import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050407] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-3xl border border-soft-500/20 bg-white/5 backdrop-blur-xl p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-soft-500/30 bg-primary-500/10 text-light-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-3xl font-display font-extrabold text-white">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-400">
              The app hit an unexpected state. Refresh the page or reopen the current section.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
