// This utility provides a comprehensive Django error handler that processes
// Django REST Framework error responses and standardizes them for frontend consumption.

/**
 * @interface DjangoErrorResponse
 * Defines the structure of a typical Django REST Framework error response.
 * Errors can be field-specific (e.g., "username") or non-field errors.
 * Error messages can be a single string or an array of strings.
 */
export interface DjangoErrorResponse {
  [key: string]: string | string[];
}

/**
 * @interface StandardizedError
 * Defines the structure of the standardized error object returned by the handler.
 * - `fieldErrors`: A record of field-specific errors, with the field name as the key
 *   and the error message as the value.
 * - `nonFieldErrors`: An array of non-field error messages.
 * - `hasErrors`: A boolean flag indicating if any errors were processed.
 */
export interface StandardizedError {
  fieldErrors: Record<string, string>;
  nonFieldErrors: string[];
  hasErrors: boolean;
}

/**
 * @function handleDjangoErrors
 * Processes a Django REST Framework error response and returns a standardized error object.
 *
 * @param {DjangoErrorResponse} errors - The Django error response object.
 * @param {string} [translationPrefix=""] - An optional prefix for translation keys.
 *
 * @returns {StandardizedError} A standardized error object with processed field-specific
 * and non-field errors.
 *
 * @example
 * const djangoErrors = {
 *   "username": ["This field may not be blank."],
 *   "non_field_errors": ["Invalid credentials provided."]
 * };
 * const standardized = handleDjangoErrors(djangoErrors, "login.errors.");
 * // standardized.fieldErrors.username will be "login.errors.This field may not be blank."
 * // standardized.nonFieldErrors[0] will be "login.errors.Invalid credentials provided."
 */
export const handleDjangoErrors = (
  errors: DjangoErrorResponse,
  translationPrefix = ""
): StandardizedError => {
  const standardizedError: StandardizedError = {
    fieldErrors: {},
    nonFieldErrors: [],
    hasErrors: false,
  };

  // Return empty object if no errors are provided
  if (!errors || typeof errors !== "object") {
    return standardizedError;
  }

  // Process each key in the Django error response
  Object.keys(errors).forEach((key) => {
    const errorValue = errors[key];
    const message = Array.isArray(errorValue) ? errorValue[0] : errorValue;

    // Add translation prefix if provided
    const finalMessage = translationPrefix ? `${translationPrefix}${message}` : message;

    // Separate field-specific errors from non-field errors
    if (key === "non_field_errors") {
      standardizedError.nonFieldErrors.push(finalMessage);
    } else {
      standardizedError.fieldErrors[key] = finalMessage;
    }
  });

  // Set hasErrors flag if any errors were processed
  standardizedError.hasErrors =
    Object.keys(standardizedError.fieldErrors).length > 0 ||
    standardizedError.nonFieldErrors.length > 0;

  return standardizedError;
};
