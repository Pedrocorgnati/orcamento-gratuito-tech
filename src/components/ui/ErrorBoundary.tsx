"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className={cn(
            "flex flex-col items-center text-center gap-3 p-6 bg-red-50 border border-red-200 rounded-xl dark:bg-red-950/30 dark:border-red-800",
            this.props.className
          )}
        >
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Algo deu errado. Tente novamente.
          </p>
          <button
            onClick={this.handleRetry}
            className="text-sm text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
