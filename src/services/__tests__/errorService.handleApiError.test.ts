import { describe, it, expect } from 'vitest';
import { handleApiError } from '../errorService';
import i18n from '../../locale/i18n';

describe('handleApiError - Centralized API Error Handler', () => {
  it('should handle network errors (status 0)', () => {
    const networkError = {
      message: 'Network Error',
      request: {}
    };

    const result = handleApiError(networkError);
    
    expect(result.response.status).toBe(0);
    expect(result.response.data.message).toBe('Network connection failed. Please check your internet connection.');
  });

  it('should handle 401 Unauthorized errors', () => {
    const error401 = {
      response: {
        status: 401,
        data: { detail: 'Token is invalid or expired' }
      }
    };

    const result = handleApiError(error401);
    
    expect(result.response.status).toBe(401);
    expect(result.response.data.message).toBe('Your session has expired. Please log in again.');
  });

  it('should handle 403 Forbidden errors', () => {
    const error403 = {
      response: {
        status: 403,
        data: { detail: 'Permission denied' }
      }
    };

    const result = handleApiError(error403);
    
    expect(result.response.status).toBe(403);
    expect(result.response.data.message).toBe("You don't have permission to perform this action.");
  });

  it('should handle 500 Internal Server errors', () => {
    const error500 = {
      response: {
        status: 500,
        data: { message: 'Internal server error' }
      }
    };

    const result = handleApiError(error500);
    
    expect(result.response.status).toBe(500);
    expect(result.response.data.message).toBe('Something went wrong on our end. Please try again later.');
  });

  it('should handle Django 400 validation errors with field-specific errors', () => {
    const djangoValidationError = {
      response: {
        status: 400,
        data: {
          username: ['Username already exists'],
          email: ['E-mail in use']
        }
      }
    };

    const result = handleApiError(djangoValidationError);
    
    expect(result.response.status).toBe(400);
    expect(result.response.data.validationErrors).toEqual({
      username: 'Username already exists',
      email: 'E-mail in use'
    });
  });

  it('should handle Django 400 validation errors with non-field errors', () => {
    const djangoNonFieldError = {
      response: {
        status: 400,
        data: {
          non_field_errors: ['Invalid credentials']
        }
      }
    };

    const result = handleApiError(djangoNonFieldError);
    
    expect(result.response.status).toBe(400);
    expect(result.response.data.nonFieldErrors).toEqual(['Invalid credentials']);
  });

  it('should handle raw Django 400 validation errors', () => {
    const rawDjangoError = {
      response: {
        status: 400,
        data: {
          username: ['Username already exists'],
          non_field_errors: ['Invalid credentials']
        }
      }
    };

    const result = handleApiError(rawDjangoError);
    
    expect(result.response.status).toBe(400);
    expect(result.response.data.validationErrors).toEqual({
      username: 'Username already exists'
    });
    expect(result.response.data.nonFieldErrors).toEqual(['Invalid credentials']);
  });

  it('should handle unknown error types with fallback', () => {
    const unknownError = {
      response: {
        status: 418, // I'm a teapot - unknown status code
        data: { message: 'Custom error' }
      }
    };

    const result = handleApiError(unknownError);
    
    expect(result.response.status).toBe(500);
    expect(result.response.data.message).toBe('Something went wrong on our end. Please try again later.');
  });

  it('should include context information when provided', () => {
    const error500 = {
      response: {
        status: 500,
        data: { message: 'Internal server error' }
      }
    };

    const context = { endpoint: '/api/login', operation: 'login' };
    const result = handleApiError(error500, context);
    
    expect(result.response.status).toBe(500);
    expect(result.response.data.context).toEqual(context);
  });

  it('should preserve original error data', () => {
    const error500 = {
      response: {
        status: 500,
        data: { message: 'Internal server error', customField: 'customValue' }
      }
    };

    const result = handleApiError(error500);
    
    expect(result.response.status).toBe(500);
    expect(result.response.data.originalError).toEqual({
      message: 'Internal server error',
      customField: 'customValue'
    });
  });
});
