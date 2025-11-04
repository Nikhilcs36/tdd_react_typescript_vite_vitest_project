import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { handleApiError } from '../services/errorService';

// Defines the shape of the global error state.
interface GlobalErrorState {
  error: {
    message: string;
    translationKey?: string;
    translationParams?: Record<string, any>;
  } | null;
}

// The initial state for the global error slice, starting with no error.
const initialState: GlobalErrorState = {
  error: null,
};

/**
 * A Redux slice for managing a global error state. This allows the app
 * to display a centralized error message for critical failures, such as
 * network errors or server errors (500, 401, 403).
 */
const globalErrorSlice = createSlice({
  name: 'globalError',
  initialState,
  reducers: {
    /**
     * Sets the global error state. This action is dispatched by the apiService
     * interceptor when a critical error is caught.
     * @param state The current state.
     * @param action The action containing the error payload.
     */
    setGlobalError: (state, action: PayloadAction<any>) => {
      const standardizedError = handleApiError(action.payload);
      // The error stored should be the `data` part of the standardized response
      state.error = standardizedError.response ? standardizedError.response.data : standardizedError;
    },
    /**
     * Clears the global error state. This is typically dispatched when the user
     * clicks a "Try Again" button on the global error display.
     */
    clearGlobalError: (state) => {
      state.error = null;
    },
  },
});

export const { setGlobalError, clearGlobalError } = globalErrorSlice.actions;
export default globalErrorSlice.reducer;
