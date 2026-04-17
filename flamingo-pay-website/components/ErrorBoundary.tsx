"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    // TODO: send to error monitoring service (Sentry, LogRocket, etc.)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border-2 border-flamingo-dark bg-white p-6 text-center shadow-[0_6px_0_0_#1A1A2E]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-flamingo-pink-soft text-2xl">
              ⚠️
            </div>
            <h2 className="display mt-3 text-xl font-extrabold text-flamingo-dark">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-flamingo-dark/60">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <p className="mt-2 rounded-lg bg-flamingo-cream p-2 font-mono text-xs text-flamingo-dark/50 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="btn-pink mt-4 rounded-xl border-2 border-flamingo-dark px-6 py-2.5 text-sm font-extrabold"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
