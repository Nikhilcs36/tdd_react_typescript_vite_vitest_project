import React from 'react';
import ErrorDisplay from './ErrorDisplay';
import { shouldDisplayErrorToUser, getErrorDetails } from '../services/errorService';
import { logError } from '../services/loggingService';

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorDetails: {
    status: number | null;
    message: string;
    url: string | null;
    timestamp: string;
  } | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: any, errorInfo: React.ErrorInfo) => void;
  resetOnRetry?: boolean;
}

/**
 * Error Boundary component that catches errors in its child component tree
 * and displays user-friendly error messages using the ErrorDisplay component
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorDetails: null,
    };
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
    };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    // Extract error details for logging
    const errorDetails = getErrorDetails(error);
    
    this.setState({
      errorDetails: errorDetails,
    });

    // Log the error and component stack for debugging
    logError({
      error: errorDetails,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.props.resetOnRetry) {
      this.resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorDetails: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Check if this error should be displayed to the user
      const shouldDisplay = shouldDisplayErrorToUser(this.state.error);
      
      if (!shouldDisplay) {
        // For errors that shouldn't be displayed, re-throw to let parent boundaries handle them
        throw this.state.error;
      }

      // Use custom fallback if provided, otherwise use default ErrorDisplay
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
          title="Application Error"
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
