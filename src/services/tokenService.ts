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
          refresh: response.data.refresh || refreshToken // Use new refresh token if provided
        })
      );
      return true;
    }
    return false;
  } catch (error) {
    return false;
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
          originalRequest.headers.Authorization = `JWT ${store.getState().auth.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Handle refresh error
      }
    }

    return Promise.reject(error);
  }
);
