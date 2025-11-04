// A centralized logging service. In a real-world application, this
// could be expanded to send logs to a remote service like Sentry,
// Datadog, or another monitoring tool.

/**
 * Logs an error to the console.
 * @param error - The error to be logged. Can be of any type.
 */
export const logError = (error: unknown): void => {
  // In a production environment, you might want to send this error
  // to a logging service instead of just logging it to the console.
  console.error('Caught an error:', error);
};
