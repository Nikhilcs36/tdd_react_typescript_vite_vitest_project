# Centralized Error Handling Architecture

## Overview

This project implements a centralized error handling system using the DRY (Don't Repeat Yourself) principle to ensure consistent error processing across all API calls.

## Architecture

### Core Components

1. **`errorService.ts`** - Central error processing service
2. **`apiService.ts`** - API service implementations (Axios + Fetch)
3. **Axios Interceptor** - Automatic error routing for Axios calls
4. **Components** - Simplified error handling in UI components

### Error Handling Strategy

The error handling is divided into two main categories:

1.  **Global Errors (Centralized)**:
    *   **Status Codes**: `401` (Unauthorized), `403` (Forbidden), `500` (Internal Server Error), and network errors (`status 0`).
    *   **Behavior**: These errors are intercepted globally by the Axios interceptor and displayed to the user in a centralized UI component (e.g., a modal or a banner). This ensures a consistent user experience for critical, application-wide issues.

2.  **Local Errors (Component-Level)**:
    *   **Status Code**: `400` (Bad Request).
    *   **Behavior**: These are typically validation errors and are handled directly within the component that initiated the API call. This allows for displaying field-specific error messages next to the relevant form inputs.

This dual approach ensures that critical errors are handled consistently across the application, while component-specific validation errors are managed locally for a better user experience.

### How It Works

#### 1. Centralized Error Processing (`errorService.ts`)

The `handleApiError` function processes all API errors consistently:

```typescript
// Centralized error handler
export const handleApiError = (
  error: any,
  context?: { endpoint?: string; operation?: string }
): any => {
  // Handle network errors, Django validation errors, known HTTP errors, etc.
  // Returns standardized error structure
};
```

#### 2. API Service Implementations (`apiService.ts`)

All fetch implementations delegate error handling to the central service:

```typescript
// Fetch implementation example
if (!response.ok) {
  const errorData = await response.json();
  // Delegate error handling to the centralized error service
  throw handleApiError({
    response: { status: response.status, data: errorData },
  });
}
```

#### 3. Axios Interceptor

The Axios interceptor automatically routes all non-`400` errors for centralized handling.

```typescript
// Axios interceptor for centralized error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Process all errors through the central handler
    const processedError = handleApiError(error);

    // Only dispatch a global error for non-400 status codes
    if (error.response && error.response.status !== 400) {
      store.dispatch(setGlobalError(processedError));
    }
    
    return Promise.reject(processedError);
  }
);
```

#### 4. Component Error Handling

Components are responsible for handling `400 Bad Request` errors, which are typically validation-related.

```typescript
// Component catch block for handling 400 errors
catch (error) {
  if (error.response && error.response.status === 400) {
    const { validationErrors, nonFieldErrors } = error.response.data;
    // Update component state with validation errors
    setErrors(validationErrors);
  }
}
```

## Error Structure

All errors follow a standardized structure:

```typescript
interface ErrorResponse {
  status: number;
  message: string;
  validationErrors?: Record<string, string>;
  nonFieldErrors?: string[];
  apiErrorMessage?: string;
  originalError?: any;
  context?: { endpoint?: string; operation?: string };
}
```

## Benefits

1. **DRY Principle**: No duplicated error handling logic
2. **Consistency**: All errors processed the same way
3. **Maintainability**: Single source of truth for error processing
4. **Testability**: Easier to test error scenarios
5. **Extensibility**: Easy to add new error types or processing logic

## Django Error Handling

Django validation errors are processed through the `processDjangoError` function which uses the existing `djangoErrorHandler` utility:

```typescript
// Processes Django errors using existing utility
export const processDjangoError = (
  errorData: any
): {
  fieldErrors: Record<string, string>;
  nonFieldErrors: string[];
  hasErrors: boolean;
} => {
  return handleDjangoErrors(errorData);
};
```

## Usage Examples

### API Services

All API services (both Axios and Fetch implementations) automatically use centralized error handling.

### Components

Components can simply catch errors and use the standardized structure:

```typescript
try {
  await apiService.post(url, data);
} catch (error) {
  // Error is already processed by handleApiError
  const { validationErrors, apiErrorMessage } = error.response?.data || {};
  // Update component state accordingly
}
```

## Testing

All error handling functionality is thoroughly tested in:

- `src/services/__tests__/errorService.*.test.ts`
- `src/services/__tests__/djangoErrorHandling.test.ts`
- `src/services/__tests__/apiService.*.test.ts`

The centralized approach ensures that error handling tests are comprehensive and consistent across the application.
