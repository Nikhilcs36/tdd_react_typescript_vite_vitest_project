// Test file for the logging service
import { describe, it, expect, vi } from 'vitest';
import { logError } from './loggingService';

describe('Logging Service', () => {
  it('should log an error to the console', () => {
    const error = new Error('Test error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError(error);

    expect(consoleSpy).toHaveBeenCalledWith('Caught an error:', error);

    consoleSpy.mockRestore();
  });

  it('should handle different types of errors', () => {
    const stringError = 'A string error';
    const objectError = { message: 'An object error' };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError(stringError);
    expect(consoleSpy).toHaveBeenCalledWith('Caught an error:', stringError);

    logError(objectError);
    expect(consoleSpy).toHaveBeenCalledWith('Caught an error:', objectError);

    consoleSpy.mockRestore();
  });
});
