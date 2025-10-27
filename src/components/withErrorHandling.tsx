import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { shouldDisplayErrorToUser } from '../services/errorService';

/**
 * Higher-Order Component that wraps a component with error handling
 * @param Component The component to wrap with error handling
 * @param errorBoundaryProps Optional props to pass to the ErrorBoundary
 * @returns A new component wrapped with error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<React.ComponentProps<typeof ErrorBoundary>>
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorHandling(${displayName})`;

  return WrappedComponent;
}

/**
 * Hook for handling errors within functional components
 * @returns An object with error state and handling functions
 */
export function useErrorHandling() {
  const [error, setError] = React.useState<any>(null);
  const [hasError, setHasError] = React.useState(false);

  const handleError = (caughtError: any) => {
    setError(caughtError);
    setHasError(true);
  };

  const clearError = () => {
    setError(null);
    setHasError(false);
  };

  const shouldDisplayError = () => {
    return hasError && shouldDisplayErrorToUser(error);
  };

  return {
    error,
    hasError,
    handleError,
    clearError,
    shouldDisplayError,
  };
}

/**
 * Utility function to create error-boundary wrapped components
 * This follows the DRY principle by providing a consistent way to handle errors
 */
export const createErrorHandledComponent = <P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Partial<React.ComponentProps<typeof ErrorBoundary>>
) => {
  return withErrorHandling(Component, boundaryProps);
};
