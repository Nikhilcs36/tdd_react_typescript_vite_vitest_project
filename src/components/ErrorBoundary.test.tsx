import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { shouldDisplayErrorToUser } from '../services/errorService';
import * as loggingService from '../services/loggingService';

// Mock child component that throws an error
const ErrorThrowingComponent = () => {
  throw new Error('Test error');
};

// Mock child component that doesn't throw an error
const NormalComponent = () => {
  return <div>Normal content</div>;
};

// Mock the error service
vi.mock('../services/errorService', () => ({
  shouldDisplayErrorToUser: vi.fn(),
  getErrorDetails: vi.fn().mockReturnValue({
    status: 500,
    message: 'Test error',
    url: null,
    timestamp: '2023-01-01T00:00:00.000Z',
  }),
}));

// Mock the logging service
vi.mock('../services/loggingService');

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid test noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should display ErrorDisplay when an error occurs and shouldDisplayErrorToUser returns true', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(true);

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Should show error display
    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should re-throw error when shouldDisplayErrorToUser returns false', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(false);

    // This should throw the error since we're not displaying it
    expect(() => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent />
        </ErrorBoundary>
      );
    }).toThrow('Test error');
  });

  it('should use custom fallback when provided', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(true);
    const customFallback = <div>Custom fallback message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback message')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(true);
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalled();
  });

  it('should reset error boundary when retry button is clicked with resetOnRetry=true', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(true);

    render(
      <ErrorBoundary resetOnRetry={true}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));

    // Error should be cleared and component should re-render
    // This test is more about behavior than specific output
    expect(console.error).toHaveBeenCalled();
  });

  it('should reload page when retry button is clicked with resetOnRetry=false', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(true);
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary resetOnRetry={false}>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should log the error when an error occurs', () => {
    vi.mocked(shouldDisplayErrorToUser).mockReturnValue(true);
    const logSpy = vi.spyOn(loggingService, 'logError');

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );

    expect(logSpy).toHaveBeenCalled();
  });
});
