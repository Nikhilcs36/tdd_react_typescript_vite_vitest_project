import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import store from "../store";
import { loginSuccess } from "../store/authSlice";

// Extend InternalAxiosRequestConfig to include custom _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

export const REFRESH_TOKEN_URL = '/api/user/token/refresh/';

/**
 * Dedicated axios instance for refresh token calls.
 * This bypasses the global error interceptor in apiService.ts
 * to prevent the global error modal from appearing on every refresh failure.
 */
const refreshAxios = axios.create();

/**
 * Mutex flag to prevent concurrent refresh token calls.
 * When true, other 401 requests will be queued instead of triggering another refresh.
 */
let isRefreshing = false;

/**
 * Queue of pending requests that arrived while a refresh was in progress.
 * Each entry contains resolve/reject functions to retry the request with the new token.
 */
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueuedRequest[] = [];

/**
 * Reset the mutex and queue state.
 * Exported for testing purposes.
 */
export const _resetRefreshState = (): void => {
  isRefreshing = false;
  failedQueue = [];
};

/**
 * Process all queued requests after a refresh attempt.
 * On success, all requests are retried with the new access token.
 * On failure, all requests are rejected.
 */
const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

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
 * Handle a 401 response error with request queue/mutex logic.
 * This is the core of the axios response interceptor, extracted for testability.
 *
 * @param error - The original axios error (must have response.status === 401)
 * @param originalRequest - The axios request config (error.config), mutated in place
 * @returns The result of retrying the request, or the rejected promise
 */
export const _handle401Error = async (error: unknown, originalRequest: ExtendedAxiosRequestConfig): Promise<AxiosResponse> => {
  // IMPORTANT: Prevent infinite loop when the refresh token endpoint itself returns 401.
  if (isRefreshTokenRequestUrl(originalRequest.url)) {
    throw error;
  }

  // If a refresh is already in progress, queue this request
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      originalRequest.headers.Authorization = `JWT ${token}`;
      return axios(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = store.getState().auth.accessToken;
      // Process all queued requests with the new token
      processQueue(null, newToken);
      // Retry the original request
      originalRequest.headers.Authorization = `JWT ${newToken}`;
      return axios(originalRequest);
    } else {
      // Refresh failed - reject all queued requests
      processQueue(error, null);
      throw error;
    }
  } catch (_refreshError) {
    // Refresh threw an exception - reject all queued requests
    processQueue(_refreshError, null);
    throw error;
  } finally {
    isRefreshing = false;
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

// Create axios interceptor to handle token expiration with request queue
axios.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as import("axios").AxiosError;
    const originalRequest = axiosError.config as ExtendedAxiosRequestConfig | undefined;

    // Only handle 401 errors that haven't been retried yet
    if (axiosError.response?.status === 401 && !originalRequest?._retry) {
      return _handle401Error(error, originalRequest!);
    }

    return Promise.reject(error);
  }
);