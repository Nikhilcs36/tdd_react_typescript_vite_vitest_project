// Type definitions for API errors

export interface ApiErrorResponse {
  status: number;
  data: {
    message: string;
    translationKey?: string;
    translationParams?: Record<string, unknown>;
    validationErrors?: Record<string, string>;
    nonFieldErrors?: string[];
    originalError?: unknown;
    context?: {
      endpoint?: string;
      operation?: string;
    };
  };
}

export interface StandardizedError {
  response?: ApiErrorResponse;
  message?: string;
  request?: unknown;
}

export interface GlobalErrorType {
  message: string;
  translationKey?: string;
  translationParams?: Record<string, unknown>;
  validationErrors?: Record<string, string>;
  nonFieldErrors?: string[];
  originalError?: unknown;
  context?: {
    endpoint?: string;
    operation?: string;
  };
  response?: {
    status?: number;
    data?: unknown;
  };
}

export interface CaughtError extends Error {
  response?: {
    status?: number;
    data?: unknown;
    url?: string;
  };
  request?: unknown;
}
