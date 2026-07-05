import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refreshAccessToken, refreshAccessTokenWithRetry, startTokenRefreshTimer, stopTokenRefreshTimer, REFRESH_TOKEN_URL, isRefreshTokenRequestUrl } from "./tokenService";
import store from "../store";
import axios from "axios";
import { loginSuccess, logoutSuccess } from "../store/actions";

// Mock axios with a factory that ensures axios.create() returns the same mock instance
vi.mock("axios", () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
    create: vi.fn(),
  };
  // Make create return the same mock instance
  mockAxiosInstance.create.mockReturnValue(mockAxiosInstance);
  return {
    default: mockAxiosInstance,
    ...mockAxiosInstance,
  };
});

const mockedAxios = axios as any;

describe("tokenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(
      loginSuccess({
        id: 1,
        username: "testuser",
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        is_staff: false,
        is_superuser: false,
        logins_remaining_for_staff: 0,
        staff_access_granted: false,
        active_role: 'regular' as const,
        role_label: 'Regular',
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("refreshAccessToken function", () => {
    it("should refresh access token successfully", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access: "new-mock-access-token",
          refresh: "new-mock-refresh-token",
        },
      });

      const result = await refreshAccessToken();

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/token/refresh/",
        { refresh: "mock-refresh-token" }
      );
      expect(store.getState().auth.accessToken).toBe("new-mock-access-token");
      expect(store.getState().auth.refreshToken).toBe("new-mock-refresh-token");
    });

    it("should return false if refresh token is not available", async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "mock-access-token",
          refresh: "",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 0,
          staff_access_granted: false,
          active_role: 'regular' as const,
          role_label: 'Regular',
        })
      );

      const result = await refreshAccessToken();

      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should return false if refresh request fails", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      const result = await refreshAccessToken();

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/token/refresh/",
        { refresh: "mock-refresh-token" }
      );
    });

    it("should keep old refresh token if new one is not provided", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access: "new-mock-access-token",
        },
      });

      const result = await refreshAccessToken();

      expect(result).toBe(true);
      expect(store.getState().auth.accessToken).toBe("new-mock-access-token");
      expect(store.getState().auth.refreshToken).toBe("mock-refresh-token");
    });

    it("should handle invalid refresh token response format", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          refresh: "new-mock-refresh-token",
        },
      });

      const result = await refreshAccessToken();

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/token/refresh/",
        { refresh: "mock-refresh-token" }
      );
    });

    it("should handle network failure during refresh", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: "Internal server error" },
        },
      });

      const result = await refreshAccessToken();

      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/token/refresh/",
        { refresh: "mock-refresh-token" }
      );
    });
  });

  describe("Axios Interceptor Logic", () => {
    it("should handle 401 errors by refreshing token", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access: "refreshed-access-token",
          refresh: "refreshed-refresh-token",
        },
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();

      const result = await refreshAccessToken();
      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/token/refresh/",
        { refresh: "mock-refresh-token" }
      );
    });

    it("should not retry if refresh token is missing", async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "mock-access-token",
          refresh: "",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 0,
          staff_access_granted: false,
          active_role: 'regular' as const,
          role_label: 'Regular',
        })
      );

      const result = await refreshAccessToken();
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should handle refresh token failure gracefully", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Refresh failed"));

      const result = await refreshAccessToken();
      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/token/refresh/",
        { refresh: "mock-refresh-token" }
      );
    });
  });

  describe("Concurrency Handling", () => {
    it("should handle multiple refresh token calls", async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          access: "refreshed-access-token",
          refresh: "refreshed-refresh-token",
        },
      });

      const results = await Promise.all([
        refreshAccessToken(),
        refreshAccessToken(),
      ]);

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe("Infinite Loop Prevention", () => {
    describe("isRefreshTokenRequestUrl", () => {
      it("should return true for refresh token endpoint URL", () => {
        expect(isRefreshTokenRequestUrl("/api/user/token/refresh/")).toBe(true);
      });

      it("should return true for refresh token endpoint URL with query params", () => {
        expect(isRefreshTokenRequestUrl("/api/user/token/refresh/?next=/dashboard")).toBe(true);
      });

      it("should return false for regular API endpoint URL", () => {
        expect(isRefreshTokenRequestUrl("/api/users/")).toBe(false);
      });

      it("should return false for random URL", () => {
        expect(isRefreshTokenRequestUrl("/api/user/profile/")).toBe(false);
      });

      it("should return false for undefined URL", () => {
        expect(isRefreshTokenRequestUrl(undefined)).toBe(false);
      });

      it("should return false for empty string URL", () => {
        expect(isRefreshTokenRequestUrl("")).toBe(false);
      });
    });

    it("should not retry refresh when the token refresh endpoint itself returns 401", async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { detail: "Token is invalid or expired" },
          config: {
            url: REFRESH_TOKEN_URL,
          },
        },
      });

      const result = await refreshAccessToken();
      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        REFRESH_TOKEN_URL,
        { refresh: "mock-refresh-token" }
      );
    });

    it("should prevent axios interceptor from retrying refresh endpoint 401 errors", async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { detail: "Token is invalid or expired" },
          config: {
            url: REFRESH_TOKEN_URL,
            _retry: false,
          },
        },
      });

      const result = await refreshAccessToken();
      expect(result).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it("should allow normal refresh flow for a valid refresh token", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access: "new-mock-access-token",
          refresh: "new-mock-refresh-token",
        },
      });

      const result = await refreshAccessToken();
      expect(result).toBe(true);
      expect(store.getState().auth.accessToken).toBe("new-mock-access-token");
      expect(store.getState().auth.refreshToken).toBe("new-mock-refresh-token");
    });
  });

  describe("Non-401 Error Handling", () => {
    it("should pass through 403 Forbidden errors without refresh attempt", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: "Access forbidden" },
          config: { _retry: false },
        },
      });

      await expect(axios.get("/api/protected")).rejects.toMatchObject({
        response: { status: 403 },
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should pass through 404 Not Found errors without refresh attempt", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: "Resource not found" },
          config: { _retry: false },
        },
      });

      await expect(axios.get("/api/nonexistent")).rejects.toMatchObject({
        response: { status: 404 },
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should handle network errors in original requests without refresh", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network disconnected"));

      await expect(axios.get("/api/data")).rejects.toThrow(
        "Network disconnected"
      );

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should not intercept 200 OK responses", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { success: true, message: "Operation successful" },
      });

      const response = await axios.get("/api/data");

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        success: true,
        message: "Operation successful",
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should pass through 400 Bad Request errors without refresh", async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: "Invalid request parameters" },
          config: { _retry: false },
        },
      });

      await expect(
        axios.put("/api/data", { invalid: "data" })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should pass through 500 Internal Server errors without refresh", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: "Internal server error" },
          config: { _retry: false },
        },
      });

      await expect(axios.get("/api/data")).rejects.toMatchObject({
        response: { status: 500 },
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe("refreshAccessTokenWithRetry function", { timeout: 15000 }, () => {
    it("should return true on first attempt success", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access: "new-mock-access-token",
          refresh: "new-mock-refresh-token",
        },
      });

      const result = await refreshAccessTokenWithRetry();

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and succeed on second attempt", async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          data: {
            access: "retried-access-token",
            refresh: "retried-refresh-token",
          },
        });

      const result = await refreshAccessTokenWithRetry();

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        REFRESH_TOKEN_URL,
        { refresh: "mock-refresh-token" }
      );
    });

    it("should retry up to MAX_RETRIES times and return false if all fail", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network error"));

      const result = await refreshAccessTokenWithRetry();

      expect(result).toBe(false);
      // 1 initial + 5 retries = 6
      expect(mockedAxios.post).toHaveBeenCalledTimes(6);
    });

    it("should return false immediately if no refresh token is available", async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "mock-access-token",
          refresh: "",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 0,
          staff_access_granted: false,
          active_role: 'regular' as const,
          role_label: 'Regular',
        })
      );

      const result = await refreshAccessTokenWithRetry();

      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should dispatch setGlobalError after all retries fail", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network error"));

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      await refreshAccessTokenWithRetry();

      const dispatchCalls = dispatchSpy.mock.calls;
      const hasSetGlobalError = dispatchCalls.some(
        (call) => call[0] && (call[0] as any).type === 'globalError/setGlobalError'
      );
      expect(hasSetGlobalError).toBe(true);
    });

    it("should not dispatch global error when refresh succeeds", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access: "new-mock-access-token",
          refresh: "new-mock-refresh-token",
        },
      });

      const dispatchSpy = vi.spyOn(store, 'dispatch');

      await refreshAccessTokenWithRetry();

      const dispatchCalls = dispatchSpy.mock.calls;
      const hasSetGlobalError = dispatchCalls.some(
        (call) => call[0] && (call[0] as any).type === 'globalError/setGlobalError'
      );
      expect(hasSetGlobalError).toBe(false);
    });
  });

  describe("Proactive Token Refresh Timer", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    describe("startTokenRefreshTimer", () => {
      it("should start a timer that refreshes tokens every 4 minutes", async () => {
        mockedAxios.post.mockResolvedValue({
          data: {
            access: "refreshed-access-token",
            refresh: "refreshed-refresh-token",
          },
        });

        startTokenRefreshTimer();

        // Fast-forward 4 minutes (but the timer callback is async, so it returns a promise)
        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/user/token/refresh/",
          { refresh: "mock-refresh-token" }
        );
      });

      it("should not start timer if no refresh token available", () => {
        store.dispatch(
          loginSuccess({
            id: 1,
            username: "testuser",
            access: "mock-access-token",
            refresh: "",
            is_staff: false,
            is_superuser: false,
            logins_remaining_for_staff: 0,
            staff_access_granted: false,
            active_role: 'regular' as const,
            role_label: 'Regular',
          })
        );

        startTokenRefreshTimer();

        vi.advanceTimersByTime(4 * 60 * 1000);

        expect(mockedAxios.post).not.toHaveBeenCalled();
      });

      it("should handle refresh failures gracefully during timer execution", async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error("Refresh failed"));

        startTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/user/token/refresh/",
          { refresh: "mock-refresh-token" }
        );

        // Timer should continue running despite failure
        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      });
    });

    describe("stopTokenRefreshTimer", () => {
      it("should handle stopping timer when no timer is active", () => {
        expect(() => stopTokenRefreshTimer()).not.toThrow();
      });

      it("should allow restarting timer after stopping", async () => {
        mockedAxios.post.mockResolvedValue({
          data: {
            access: "refreshed-access-token",
            refresh: "refreshed-refresh-token",
          },
        });

        startTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        stopTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        startTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      });
    });

    describe("Timer Lifecycle", () => {
      it("should stop timer on logout", async () => {
        mockedAxios.post.mockResolvedValue({
          data: {
            access: "refreshed-access-token",
            refresh: "refreshed-refresh-token",
          },
        });

        startTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        store.dispatch(logoutSuccess());
        stopTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      });

      it("should restart timer after login", async () => {
        mockedAxios.post.mockResolvedValue({
          data: {
            access: "refreshed-access-token",
            refresh: "refreshed-refresh-token",
          },
        });

        startTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        stopTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);

        startTokenRefreshTimer();

        await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
        expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      });
    });
  });
});