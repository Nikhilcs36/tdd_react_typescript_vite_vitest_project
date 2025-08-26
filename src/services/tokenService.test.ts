import { describe, it, expect, vi, beforeEach } from "vitest";
import { refreshAccessToken } from "./tokenService";
import store from "../store";
import axios from "axios";
import { loginSuccess } from "../store/actions";

vi.mock("axios");
const mockedAxios = axios as any;

describe("tokenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(loginSuccess({
      id: 1,
      username: "testuser",
      access: "mock-access-token",
      refresh: "mock-refresh-token"
    }));
  });

  it("should refresh access token successfully", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access: "new-mock-access-token",
        refresh: "new-mock-refresh-token"
      }
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
    // Clear auth state
    store.dispatch(loginSuccess({
      id: 1,
      username: "testuser",
      access: "mock-access-token",
      refresh: ""
    }));

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
        access: "new-mock-access-token"
        // No refresh token in response
      }
    });

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(store.getState().auth.accessToken).toBe("new-mock-access-token");
    expect(store.getState().auth.refreshToken).toBe("mock-refresh-token"); // Old refresh token maintained
  });
});
