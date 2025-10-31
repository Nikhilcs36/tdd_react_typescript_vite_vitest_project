// Centralized error service for handling common backend errors with i18n support
import i18n from "../locale/i18n";
import { handleDjangoErrors } from "../utils/djangoErrorHandler";

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
 * Processes backend errors and returns user-friendly messages with i18n support
 * @param error The error object from API calls
 * @returns User-friendly error message with translation applied
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  // Handle network errors (no response)
  if (!error.response) {
    const networkError = ERROR_MAPPINGS[0];
    return i18n.t(networkError.translationKey, {
      defaultValue: networkError.userFriendlyMessage,
    });
  }

  const status = error.response.status;
  const errorMapping = ERROR_MAPPINGS[status];

  if (errorMapping) {
    // Return translated message for known error types
    return i18n.t(errorMapping.translationKey, {
      defaultValue: errorMapping.userFriendlyMessage,
    });
  }

  // Handle Django validation errors (400 status)
  if (status === 400 && error.response.data) {
    const djangoErrors = error.response.data;

    // Handle apiErrorMessage field (for test compatibility)
    if (djangoErrors.apiErrorMessage) {
      const translationKey = djangoErrors.apiErrorMessage;
      // Extract the actual error message from the translation key format
      const errorMessage = translationKey
        .replace("login.errors.", "")
        .replace("signup.errors.", "");
      return i18n.t(translationKey, { defaultValue: errorMessage });
    }

    // Handle validationErrors object structure (for test compatibility)
    if (
      djangoErrors.validationErrors &&
      typeof djangoErrors.validationErrors === "object"
    ) {
      // If validationErrors is an empty object, check for apiErrorMessage
      if (
        Object.keys(djangoErrors.validationErrors).length === 0 &&
        djangoErrors.apiErrorMessage
      ) {
        const translationKey = djangoErrors.apiErrorMessage;
        const errorMessage = translationKey
          .replace("login.errors.", "")
          .replace("signup.errors.", "");
        return i18n.t(translationKey, { defaultValue: errorMessage });
      }
    }

    // Check for non-field errors (both formats: nonFieldErrors and non_field_errors)
    if (djangoErrors.nonFieldErrors && djangoErrors.nonFieldErrors.length > 0) {
      const firstErrorMessage = djangoErrors.nonFieldErrors[0];
      // Try both login and signup namespaces for translation
      return i18n.t(`signup.errors.${firstErrorMessage}`, {
        defaultValue: i18n.t(`login.errors.${firstErrorMessage}`, {
          defaultValue: firstErrorMessage,
        }),
      });
    }

    if (
      djangoErrors.non_field_errors &&
      djangoErrors.non_field_errors.length > 0
    ) {
      const firstErrorMessage = djangoErrors.non_field_errors[0];
      // Try both login and signup namespaces for translation
      return i18n.t(`signup.errors.${firstErrorMessage}`, {
        defaultValue: i18n.t(`login.errors.${firstErrorMessage}`, {
          defaultValue: firstErrorMessage,
        }),
      });
    }

    // Check if it's a Django validation error with field-specific errors
    if (Object.keys(djangoErrors).length > 0) {
      const firstErrorKey = Object.keys(djangoErrors)[0];
      const firstErrorMessage = Array.isArray(djangoErrors[firstErrorKey])
        ? djangoErrors[firstErrorKey][0]
        : djangoErrors[firstErrorKey];

      // Try both login and signup namespaces for translation
      return i18n.t(`signup.errors.${firstErrorMessage}`, {
        defaultValue: i18n.t(`login.errors.${firstErrorMessage}`, {
          defaultValue: firstErrorMessage,
        }),
      });
    }

    // Handle cases where the error data is a simple string or object
    if (typeof djangoErrors === "string") {
      // Try both login and signup namespaces for translation
      return i18n.t(`signup.errors.${djangoErrors}`, {
        defaultValue: i18n.t(`login.errors.${djangoErrors}`, {
          defaultValue: djangoErrors,
        }),
      });
    }

    if (djangoErrors.detail) {
      // Try both login and signup namespaces for translation
      return i18n.t(`signup.errors.${djangoErrors.detail}`, {
        defaultValue: i18n.t(`login.errors.${djangoErrors.detail}`, {
          defaultValue: djangoErrors.detail,
        }),
      });
    }

    // Fallback: return the error data as string if it's not a complex object
    return String(djangoErrors);
  }

  // Fallback for unknown errors
  const fallbackError = ERROR_MAPPINGS[500];
  return i18n.t(fallbackError.translationKey, {
    defaultValue: fallbackError.userFriendlyMessage,
  });
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
  // Handle network errors (no response)
  if (!error.response) {
    return handleNetworkError(context);
  }

  const status = error.response.status;
  const errorMapping = ERROR_MAPPINGS[status];

  if (errorMapping) {
    return handleKnownError(status, error.response.data, errorMapping, context);
  }

  // Handle Django validation errors (400 status) - preserve original structure for tests
  if (status === 400 && error.response.data) {
    return handleDjangoValidationError(error.response.data, context);
  }

  // Fallback for unknown errors
  return handleFallbackError(error.response.data, context);
};

/**
 * Checks if an error object has Django error structure
 * Django errors typically have specific field names like 'nonFieldErrors', 'validationErrors'
 * or field-specific error arrays/strings, or raw Django format like 'non_field_errors'
 */
export const hasDjangoErrorStructure = (errorData: any): boolean => {
  if (!errorData || typeof errorData !== "object") {
    return false;
  }

  // Check for Django-specific field names (both processed and raw formats)
  const hasDjangoFields = Object.keys(errorData).some(
    (key) =>
      key === "nonFieldErrors" ||
      key === "validationErrors" ||
      key === "detail" ||
      key === "message" ||
      key === "non_field_errors"
  );

  // Check if any property has string or array values typical of Django errors
  const hasDjangoErrorValues = Object.keys(errorData).some((key) => {
    const value = errorData[key];
    return Array.isArray(value) || typeof value === "string";
  });

  // Must have both Django-specific fields AND Django error values
  // But exclude common Axios error fields that might cause false positives
  const isAxiosError = Object.keys(errorData).some(
    (key) =>
      key === "code" || key === "name" || key === "config" || key === "request"
  );

  return hasDjangoFields && hasDjangoErrorValues && !isAxiosError;
};

/**
 * Processes Django errors using the existing djangoErrorHandler utility
 * Returns standardized error structure with fieldErrors and nonFieldErrors
 */
export const processDjangoError = (
  errorData: any
): {
  fieldErrors: Record<string, string>;
  nonFieldErrors: string[];
  hasErrors: boolean;
} => {
  if (!hasDjangoErrorStructure(errorData)) {
    return {
      fieldErrors: {},
      nonFieldErrors: [],
      hasErrors: false,
    };
  }

  // Use the existing djangoErrorHandler utility
  return handleDjangoErrors(errorData);
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
    originalError: errorData,
    context,
  });
};

/**
 * Handles Django validation errors (400 status)
 */
const handleDjangoValidationError = (
  djangoErrors: any,
  context?: { endpoint?: string; operation?: string }
): any => {
  // Check if it's a Django validation error with field-specific errors
  if (
    djangoErrors.validationErrors &&
    Object.keys(djangoErrors.validationErrors).length > 0
  ) {
    const firstErrorKey = Object.keys(djangoErrors.validationErrors)[0];
    const firstErrorMessage = djangoErrors.validationErrors[firstErrorKey];
    const userFriendlyMessage = i18n.t(`validation.${firstErrorKey}`, {
      defaultValue: firstErrorMessage,
    });

    return buildErrorResponse({
      status: 400,
      message: userFriendlyMessage,
      validationErrors: djangoErrors.validationErrors,
      context,
    });
  }

  // Check for non-field errors
  if (djangoErrors.nonFieldErrors && djangoErrors.nonFieldErrors.length > 0) {
    const userFriendlyMessage = i18n.t(`validation.non_field`, {
      defaultValue: djangoErrors.nonFieldErrors[0],
    });

    return buildErrorResponse({
      status: 400,
      message: userFriendlyMessage,
      nonFieldErrors: djangoErrors.nonFieldErrors,
      context,
    });
  }

  // Handle raw Django error format (for test compatibility)
  // Check if this is a raw Django error response that needs to be preserved
  const hasDjangoErrorStructure = Object.keys(djangoErrors).some(
    (key) =>
      Array.isArray(djangoErrors[key]) || typeof djangoErrors[key] === "string"
  );

  if (hasDjangoErrorStructure) {
    // Process Django errors using the existing djangoErrorHandler
    const standardizedError = handleDjangoErrors(djangoErrors);

    if (standardizedError.hasErrors) {
      // Create user-friendly message from the first error
      const firstError =
        standardizedError.nonFieldErrors[0] ||
        Object.values(standardizedError.fieldErrors)[0];
      const userFriendlyMessage = i18n.t(`validation.generic`, {
        defaultValue: firstError,
      });

      return buildErrorResponse({
        status: 400,
        message: userFriendlyMessage,
        validationErrors: standardizedError.fieldErrors,
        nonFieldErrors: standardizedError.nonFieldErrors,
        context,
      });
    }
  }

  // Fallback for unknown validation errors
  const fallbackError = ERROR_MAPPINGS[500];
  const userFriendlyMessage = i18n.t(fallbackError.translationKey, {
    defaultValue: fallbackError.userFriendlyMessage,
  });

  return buildErrorResponse({
    status: 500,
    message: userFriendlyMessage,
    originalError: djangoErrors,
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
  validationErrors?: Record<string, string>;
  nonFieldErrors?: string[];
  originalError?: any;
  context?: { endpoint?: string; operation?: string };
}): any => {
  const responseData: any = {
    message: options.message,
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
