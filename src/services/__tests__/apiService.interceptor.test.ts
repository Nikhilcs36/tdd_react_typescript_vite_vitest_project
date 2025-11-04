import { describe, it, expect } from 'vitest';
import { shouldDisplayErrorToUser } from '../errorService';

// Test the error handling logic directly
describe('Axios Interceptor - Centralized Error Handling Logic', () => {
  it('should NOT display global error for 400 status (validation errors)', () => {
    // Create a 400 error
    const error400 = {
      response: {
        status: 400,
        data: {
          validationErrors: {
            username: ['This field is required.']
          }
        }
      }
    };

    // Test the logic directly
    const shouldDisplay = shouldDisplayErrorToUser(error400);
    
    // Verify that 400 errors should NOT be displayed globally
    expect(shouldDisplay).toBe(false);
  });

  it('should display global error for 500 status (server errors)', () => {
    // Create a 500 error
    const error500 = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' }
      }
    };

    // Test the logic directly
    const shouldDisplay = shouldDisplayErrorToUser(error500);
    
    // Verify that 500 errors should be displayed globally
    expect(shouldDisplay).toBe(true);
  });

  it('should display global error for network errors (status 0)', () => {
    // Create a network error (no response)
    const networkError = {
      request: {}, // Simulate a network error (no response property)
      message: 'Network Error'
    };

    // Test the logic directly
    const shouldDisplay = shouldDisplayErrorToUser(networkError);
    
    // Verify that network errors should be displayed globally
    expect(shouldDisplay).toBe(true);
  });

  it('should display global error for 401 status (unauthorized)', () => {
    // Create a 401 error
    const error401 = {
      response: {
        status: 401,
        data: { message: 'Token is invalid or expired' }
      }
    };

    // Test the logic directly
    const shouldDisplay = shouldDisplayErrorToUser(error401);
    
    // Verify that 401 errors should be displayed globally
    expect(shouldDisplay).toBe(true);
  });

  it('should display global error for 403 status (forbidden)', () => {
    // Create a 403 error
    const error403 = {
      response: {
        status: 403,
        data: { message: 'You do not have permission to perform this action' }
      }
    };

    // Test the logic directly
    const shouldDisplay = shouldDisplayErrorToUser(error403);
    
    // Verify that 403 errors should be displayed globally
    expect(shouldDisplay).toBe(true);
  });
});
