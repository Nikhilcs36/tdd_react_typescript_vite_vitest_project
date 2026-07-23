import axios from "axios";
import store from "../store";
import { loginSuccess } from "../store/authSlice";
import { setGlobalError } from "../store/globalErrorSlice";

interface TokenResponse {
  access: string;
  refresh: string;
}

export const REFRESH_TOKEN_URL = '/api/user/token/refresh/';

// Maximum number of retry attempts for refresh token
export const MAX_RETRIES = 5;
// Delay between retries in milliseconds
export const RETRY_DELAY_MS = 1000;

/**
 * Dedicated axios instance for refresh token calls.
 * This bypasses the global error interceptor in apiService.ts
 * to prevent the global error modal from appearing on every refresh failure.
 */
const refreshAxios = axios.create();

/**
 * Check if a URL is the token refresh endpoint.
 * This is used to prevent infinite retry loops in the axios interceptor.
 */
export const isRefreshTokenRequestUrl = (url?: string): boolean => {
  return !!url && url.includes(REFRESH_TOKEN_URL);
};

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = store.getState().auth.refreshToken;

    if (!refreshToken) {
      return false;
    }

    const response = await refreshAxios.post<TokenResponse>(
      REFRESH_TOKEN_URL,
      { refresh: refreshToken }
    );

    if (response.data.access) {
      // Update store with new tokens
      store.dispatch(
        loginSuccess({
          ...store.getState().auth.user!,
          access: response.data.access,
          refresh: response.data.refresh || refreshToken, // Use new refresh token if provided
        })
      );
      return true;
    }
    return false;
  } catch (_error) {
    return false;
  }
};

/**
 * Attempts to refresh the access token with retry logic.
 * Retries up to MAX_RETRIES times with a delay between each attempt.
 * If all attempts fail, dispatches a global error to inform the user.
 * @returns Promise<boolean> true if refresh succeeded, false if all retries failed
 */
export const refreshAccessTokenWithRetry = async (): Promise<boolean> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const success = await refreshAccessToken();
    if (success) {
      return true;
    }

    // If no refresh token is available, fail immediately
    if (!store.getState().auth.refreshToken) {
      return false;
    }

    // Wait before retrying (only if not the last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  // All retries failed - dispatch global error to inform the user
  store.dispatch(
    setGlobalError({
      response: {
        status: 401,
        data: {
          message: "Your session refresh failed after multiple attempts. Please log in again.",
          translationKey: "errors.401.token_invalid_or_expired",
        },
      },
    })
  );
  return false;
};

// Global variable to store the refresh timer
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Starts a proactive token refresh timer that refreshes tokens every 4 minutes
 * to prevent expiration (since backend OTP expires in 5 minutes)
 */
export const startTokenRefreshTimer = (): void => {
  // Clear any existing timer
  stopTokenRefreshTimer();

  const refreshToken = store.getState().auth.refreshToken;

  // Only start timer if we have a refresh token
  if (!refreshToken) {
    return;
  }

  // Set timer to refresh every 4 minutes (240,000 milliseconds)
  refreshTimer = setInterval(async () => {
    try {
      await refreshAccessToken();
    } catch (_error) {
      // Timer continues running even if refresh fails
      // Errors are handled by the centralized error system
    }
  }, 4 * 60 * 1000); // 4 minutes
};

/**
 * Stops the proactive token refresh timer
 */
export const stopTokenRefreshTimer = (): void => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// Create axios interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is unauthorized and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // IMPORTANT: Prevent infinite loop when the refresh token endpoint itself returns 401.
      // Without this guard, a 401 on the refresh endpoint would trigger another refresh
      // attempt, creating an infinite retry loop that floods the console with 401 errors.
      if (isRefreshTokenRequestUrl(originalRequest.url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Update the authorization header with new access token
          originalRequest.headers.Authorization = `JWT ${
            store.getState().auth.accessToken
          }`;
          return axios(originalRequest);
        }
      } catch (_refreshError) {
        // Handle refresh error
      }
    }

    return Promise.reject(error);
  }
);
