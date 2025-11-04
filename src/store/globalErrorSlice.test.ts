import { describe, it, expect } from 'vitest';
import globalErrorReducer, { setGlobalError, clearGlobalError } from './globalErrorSlice';

describe('globalErrorSlice', () => {
  const initialState = {
    error: null,
  };

  it('should handle initial state', () => {
    expect(globalErrorReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setGlobalError', () => {
    const errorPayload = { response: { status: 500, message: 'Internal Server Error' } };
    const actual = globalErrorReducer(initialState, setGlobalError(errorPayload));
    expect(actual.error?.message).toEqual('Something went wrong on our end. Please try again later.');
  });

  it('should handle clearGlobalError', () => {
    const currentState = {
      error: { message: 'Internal Server Error' },
    };
    const actual = globalErrorReducer(currentState, clearGlobalError());
    expect(actual.error).toBeNull();
  });

  it('should store a standardized error object', () => {
    const axiosError = {
      response: {
        data: { detail: 'Internal Server Error' },
        status: 500
      }
    };
    
    const action = setGlobalError(axiosError as any);
    const actual = globalErrorReducer(initialState, action);
    
    // Verify that the stored error is the standardized data object
    expect(actual.error).toEqual(
      expect.objectContaining({
        message: 'Something went wrong on our end. Please try again later.',
        translationKey: 'errors.500.internal_server_error',
      })
    );
    expect(actual.error).not.toHaveProperty('response');
  });
});
