// Centralized error service for handling common backend errors with i18n support
import i18n from "../locale/i18n";
import { handleDjangoErrors } from "../utils/djangoErrorHandler";
import { logError } from "./loggingService";

/**
 * Common backend error types that should be displayed to users
 */
export interface BackendError {
  status: number;
  message: string;
  translationKey: string;
  userFriendlyMessage: string;
}

/**
 * Maps HTTP status codes to user-friendly error messages with translation support
 */
export const ERROR_MAPPINGS: Record<number, BackendError> = {
  401: {
    status: 401,
    message: "Token is invalid or expired",
    translationKey: "errors.401.token_invalid_or_expired",
    userFriendlyMessage: "Your session has expired. Please log in again.",
  },
  403: {
    status: 403,
    message: "You do not have permission to perform this action",
    translationKey: "errors.403.permission_denied",
    userFriendlyMessage: "You don't have permission to perform this action.",
  },
  500: {
    status: 500,
    message: "Internal server error",
    translationKey: "errors.500.internal_server_error",
    userFriendlyMessage:
      "Something went wrong on our end. Please try again later.",
  },
  0: {
    status: 0,
    message: "Network error",
    translationKey: "errors.network.network_error",
    userFriendlyMessage:
      "Network connection failed. Please check your internet connection.",
  },
};

/**
 * Checks if an error should be displayed to the user
 * Some errors (like 401, 403, 500) should be shown, others might be handled differently
 * Also handles rendering errors by checking if it's a JavaScript Error object
 */
export const shouldDisplayErrorToUser = (error: any): boolean => {
  // Handle rendering errors (JavaScript Error objects)
  if (error instanceof Error) {
    return true;
  }

  // Handle HTTP errors
  if (!error.response) {
    // Network errors should be shown to users
    return true;
  }

  const status = error.response.status;
  return status === 401 || status === 403 || status === 500 || status === 0;
};

/**
 * Centralized API error handler that processes errors consistently across the application
 * @param error The error object from API calls
 * @param context Additional context for error handling (e.g., API endpoint, operation type)
 * @returns Standardized error object ready for display or re-throwing
 */
export const handleApiError = (
  error: any,
  context?: { endpoint?: string; operation?: string }
): any => {
  // Log all errors for debugging and monitoring purposes
  logError(error);

  // Handle simple error objects (like authentication errors)
  if (error.message && !error.response) {
    // Check if this is a network error (has request property)
    if (error.request) {
      return handleNetworkError(context);
    }
    // For simple authentication errors, preserve the original error structure
    // This ensures compatibility with existing tests that expect simple errors
    return error;
  }

  // Handle network errors (no response)
  if (!error.response) {
    return handleNetworkError(context);
  }

  const status = error.response.status;
  const errorMapping = ERROR_MAPPINGS[status];

  if (errorMapping) {
    return handleKnownError(status, error.response.data, errorMapping, context);
  }

  // Handle Django validation errors (400 status)
  if (status === 400 && error.response.data) {
    const standardizedError = handleDjangoErrors(error.response.data);
    const firstError =
      standardizedError.nonFieldErrors[0] ||
      Object.values(standardizedError.fieldErrors)[0] ||
      'Validation error';
    
    return buildErrorResponse({
      status: 400,
      message: firstError,
      validationErrors: standardizedError.fieldErrors,
      nonFieldErrors: standardizedError.nonFieldErrors,
      context,
    });
  }

  // Fallback for unknown errors
  return handleFallbackError(error.response.data, context);
};

/**
 * Handles known error types (401, 403, 500)
 */
const handleKnownError = (
  status: number,
  errorData: any,
  errorMapping: BackendError,
  context?: { endpoint?: string; operation?: string }
): any => {
  const userFriendlyMessage = i18n.t(errorMapping.translationKey, {
    defaultValue: errorMapping.userFriendlyMessage,
  });

  // For Django-specific errors (401, 403), preserve the original error structure
  if ((status === 401 || status === 403) && errorData) {
    // Handle Django error format for authentication/authorization errors
    const hasDjangoErrorStructure = Object.keys(errorData).some(
      (key) =>
        Array.isArray(errorData[key]) || typeof errorData[key] === "string"
    );

    if (hasDjangoErrorStructure) {
      // Process Django errors using the existing djangoErrorHandler
      const standardizedError = handleDjangoErrors(errorData);

      if (standardizedError.hasErrors) {
        return buildErrorResponse({
          status,
          message: userFriendlyMessage,
          translationKey: errorMapping.translationKey, // Pass translation key
          validationErrors: standardizedError.fieldErrors,
          nonFieldErrors: standardizedError.nonFieldErrors,
          originalError: errorData,
          context,
        });
      }
    }
  }

  return buildErrorResponse({
    status,
    message: userFriendlyMessage,
    translationKey: errorMapping.translationKey, // Pass translation key
    originalError: errorData,
    context,
  });
};

/**
 * Handles fallback errors (unknown error types)
 */
const handleFallbackError = (
  errorData: any,
  context?: { endpoint?: string; operation?: string }
): any => {
  const fallbackError = ERROR_MAPPINGS[500];
  const userFriendlyMessage = i18n.t(fallbackError.translationKey, {
    defaultValue: fallbackError.userFriendlyMessage,
  });

  return buildErrorResponse({
    status: 500,
    message: userFriendlyMessage,
    translationKey: fallbackError.translationKey, // Pass translation key
    originalError: errorData,
    context,
  });
};

/**
 * Handles network errors (no response from server)
 */
const handleNetworkError = (context?: {
  endpoint?: string;
  operation?: string;
}): any => {
  const networkError = ERROR_MAPPINGS[0];
  const userFriendlyMessage = i18n.t(networkError.translationKey, {
    defaultValue: networkError.userFriendlyMessage,
  });

  return buildErrorResponse({
    status: 0,
    message: userFriendlyMessage,
    translationKey: networkError.translationKey, // Pass translation key
    context,
  });
};

/**
 * Builds a standardized error response object
 * @param options Configuration options for the error response
 */
export const buildErrorResponse = (options: {
  status: number;
  message: string;
  translationKey?: string;
  translationParams?: Record<string, any>;
  validationErrors?: Record<string, string>;
  nonFieldErrors?: string[];
  originalError?: any;
  context?: { endpoint?: string; operation?: string };
}): any => {
  const responseData: any = {
    message: options.message,
    translationKey: options.translationKey,
    translationParams: options.translationParams,
  };

  // Add optional fields if provided
  if (options.validationErrors) {
    responseData.validationErrors = options.validationErrors;
  }
  if (options.nonFieldErrors) {
    responseData.nonFieldErrors = options.nonFieldErrors;
  }
  if (options.originalError) {
    responseData.originalError = options.originalError;
  }
  if (options.context) {
    responseData.context = options.context;
  }

  return {
    response: {
      status: options.status,
      data: responseData,
    },
  };
};

/**
 * Extracts error details for logging and debugging purposes
 */
export const getErrorDetails = (
  error: any
): {
  status: number | null;
  message: string;
  url: string | null;
  timestamp: string;
} => {
  return {
    status: error.response?.status || null,
    message: error.message || "Unknown error",
    url: error.response?.config?.url || error.response?.url || null,
    timestamp: new Date().toISOString(),
  };
};
