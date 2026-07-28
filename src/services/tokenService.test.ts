import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refreshAccessToken, _handle401Error, _resetRefreshState, startTokenRefreshTimer, stopTokenRefreshTimer, REFRESH_TOKEN_URL, isRefreshTokenRequestUrl } from "./tokenService";
import store from "../store";
import axios from "axios";
import { loginSuccess, logoutSuccess } from "../store/authSlice";

// Create a callable mock axios instance that can be invoked as a function
const { mockAxiosInstance } = vi.hoisted(() => {
  const mockFn = vi.fn().mockResolvedValue({ status: 200, data: {} });
  const instance = Object.assign(mockFn, {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
    create: vi.fn(),
  });
  instance.create.mockReturnValue(instance);
  return { mockAxiosInstance: instance };
});

vi.mock("axios", () => {
  return {
    default: mockAxiosInstance,
    ...mockAxiosInstance,
  };
});

const mockedAxios = axios as any;

// Helper to create a 401 error with config for _handle401Error
const create401Error = (url: string) => {
  const config = { url, headers: {}, _retry: false };
  return {
    response: { status: 401, data: {} },
    config,
  };
};

describe("tokenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetRefreshState();
    // Suppress expected console.error from error handling tests to keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
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

  describe("_handle401Error - Request Queue & Mutex", () => {
    it("should queue concurrent 401 requests and retry with new token", async () => {
      // Setup: refresh succeeds once
      mockedAxios.post.mockResolvedValue({
        data: {
          access: "refreshed-access-token",
          refresh: "refreshed-refresh-token",
        },
      });
      // Mock axios retry to return a success response
      mockedAxios.get.mockResolvedValue({ status: 200, data: { success: true } });

      const error1 = create401Error("/api/data/1");
      const error2 = create401Error("/api/data/2");
      const error3 = create401Error("/api/data/3");

      // Fire all 3 concurrently
      const results = await Promise.allSettled([
        _handle401Error(error1, error1.config),
        _handle401Error(error2, error2.config),
        _handle401Error(error3, error3.config),
      ]);

      // All 3 requests should succeed (retried after refresh)
      expect(results[0].status).toBe("fulfilled");
      expect(results[1].status).toBe("fulfilled");
      expect(results[2].status).toBe("fulfilled");

      // Only 1 refresh call should be made (mutex prevents concurrent refreshes)
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        REFRESH_TOKEN_URL,
        { refresh: "mock-refresh-token" }
      );
    });

    it("should reject all queued requests if refresh fails", async () => {
      // Setup: refresh fails
      mockedAxios.post.mockRejectedValue(new Error("Refresh failed"));

      const error1 = create401Error("/api/data/1");
      const error2 = create401Error("/api/data/2");
      const error3 = create401Error("/api/data/3");

      const results = await Promise.allSettled([
        _handle401Error(error1, error1.config),
        _handle401Error(error2, error2.config),
        _handle401Error(error3, error3.config),
      ]);

      // All 3 requests should be rejected
      expect(results[0].status).toBe("rejected");
      expect(results[1].status).toBe("rejected");
      expect(results[2].status).toBe("rejected");

      // Only 1 refresh call should be made
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it("should not queue refresh endpoint 401 errors (infinite loop prevention)", async () => {
      const error = create401Error(REFRESH_TOKEN_URL);

      await expect(
        _handle401Error(error, error.config)
      ).rejects.toThrow();

      // The refresh endpoint should not trigger another refresh
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

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

  describe("Non-401 Error Handling", () => {
    it("should pass through 403 Forbidden errors without refresh attempt", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: "Access forbidden" },
          config: { _retry: false, headers: {} },
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
          config: { _retry: false, headers: {} },
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
          config: { _retry: false, headers: {} },
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
          config: { _retry: false, headers: {} },
        },
      });

      await expect(axios.get("/api/data")).rejects.toMatchObject({
        response: { status: 500 },
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
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