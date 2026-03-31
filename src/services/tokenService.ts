import axios from "axios";
import store from "../store";
import { loginSuccess } from "../store/actions";

interface TokenResponse {
  access: string;
  refresh: string;
}

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = store.getState().auth.refreshToken;

    if (!refreshToken) {
      return false;
    }

    const response = await axios.post<TokenResponse>(
      "/api/user/token/refresh/",
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
