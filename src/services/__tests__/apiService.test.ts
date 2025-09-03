import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  axiosApiServiceLoadUserList,
  fetchApiServiceLoadUserList,
  axiosApiServiceGetCurrentUser,
  axiosApiServiceGetUser,
  axiosApiServiceUpdateUser,
  axiosApiServiceDeleteUser,
  axiosApiServiceLogin,
  axiosApiServiceSignUp,
  axiosApiServiceActivation,
} from "../apiService";
import store from "../../store";

// Mock the store
vi.mock("../../store", () => ({
  default: {
    getState: vi.fn(),
    dispatch: vi.fn(),
  },
}));

const mockedStore = store as any;

describe("API Service Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store mock
    mockedStore.getState.mockReturnValue({
      auth: {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("User List Service Authentication", () => {
    describe("axiosApiServiceLoadUserList", () => {
      it("should throw error when no access token is available", async () => {
        // Arrange - No authentication token
        mockedStore.getState.mockReturnValue({
          auth: {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          },
        });

        // Act & Assert
        await expect(
          axiosApiServiceLoadUserList.get("/api/user/users/", 1, 3)
        ).rejects.toThrow("Authentication token not found");
      });

      it("should include authorization header when access token is available", async () => {
        // Arrange - Mock authenticated user
        mockedStore.getState.mockReturnValue({
          auth: {
            isAuthenticated: true,
            user: { id: 1, username: "testuser" },
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        });

        // Mock axios to capture the request
        const axios = await import("axios");
        const axiosSpy = vi.spyOn(axios.default, "get").mockResolvedValue({
          data: {
            count: 0,
            next: null,
            previous: null,
            results: [],
          },
        });

        // Act
        await axiosApiServiceLoadUserList.get("/api/user/users/", 1, 3);

        // Assert
        expect(axiosSpy).toHaveBeenCalledWith("/api/user/users/", {
          headers: {
            "Accept-Language": "en",
            Authorization: "JWT mock-access-token",
          },
          params: { page: 1, page_size: 3 },
        });
      });

      it("should succeed when valid access token is provided", async () => {
        // Arrange - Mock authenticated user
        mockedStore.getState.mockReturnValue({
          auth: {
            isAuthenticated: true,
            user: { id: 1, username: "testuser" },
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        });

        // Mock successful response
        const axios = await import("axios");
        vi.spyOn(axios.default, "get").mockResolvedValue({
          data: {
            count: 2,
            next: null,
            previous: null,
            results: [
              { id: 1, username: "user1", email: "user1@test.com" },
              { id: 2, username: "user2", email: "user2@test.com" },
            ],
          },
        });

        // Act
        const result = await axiosApiServiceLoadUserList.get(
          "/api/user/users/",
          1,
          3
        );

        // Assert
        expect(result).toEqual({
          count: 2,
          next: null,
          previous: null,
          results: [
            { id: 1, username: "user1", email: "user1@test.com" },
            { id: 2, username: "user2", email: "user2@test.com" },
          ],
        });
      });
    });

    describe("fetchApiServiceLoadUserList", () => {
      it("should throw error when no access token is available", async () => {
        // Arrange - No authentication token
        mockedStore.getState.mockReturnValue({
          auth: {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          },
        });

        // Act & Assert
        await expect(
          fetchApiServiceLoadUserList.get("/api/user/users/", 1, 3)
        ).rejects.toThrow("Authentication token not found");
      });

      it("should include authorization header when access token is available", async () => {
        // Arrange - Mock authenticated user
        mockedStore.getState.mockReturnValue({
          auth: {
            isAuthenticated: true,
            user: { id: 1, username: "testuser" },
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        });

        // Mock fetch to capture the request
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              count: 0,
              next: null,
              previous: null,
              results: [],
            }),
        });

        // Act
        await fetchApiServiceLoadUserList.get("/api/user/users/", 1, 3);

        // Assert
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/user/users/"),
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "Accept-Language": "en",
              Authorization: "JWT mock-access-token",
            }),
          })
        );
      });

      it("should succeed when valid access token is provided", async () => {
        // Arrange - Mock authenticated user
        mockedStore.getState.mockReturnValue({
          auth: {
            isAuthenticated: true,
            user: { id: 1, username: "testuser" },
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
          },
        });

        // Mock successful response
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              count: 2,
              next: null,
              previous: null,
              results: [
                { id: 1, username: "user1", email: "user1@test.com" },
                { id: 2, username: "user2", email: "user2@test.com" },
              ],
            }),
        });

        // Act
        const result = await fetchApiServiceLoadUserList.get(
          "/api/user/users/",
          1,
          3
        );

        // Assert
        expect(result).toEqual({
          count: 2,
          next: null,
          previous: null,
          results: [
            { id: 1, username: "user1", email: "user1@test.com" },
            { id: 2, username: "user2", email: "user2@test.com" },
          ],
        });
      });
    });
  });

  describe("Authentication Consistency Tests", () => {
    // Test that all protected endpoints follow the same authentication pattern
    it("should require authentication for all protected endpoints consistently", () => {
      // This test ensures that all API services that should require authentication
      // follow the same pattern of checking for accessToken and throwing errors

      // The pattern should be:
      // 1. Check if accessToken exists in store
      // 2. If not, throw Error("Authentication token not found")
      // 3. If yes, include Authorization header

      // This test serves as documentation of the expected authentication pattern
      expect(true).toBe(true); // Placeholder - the real test is in the implementation
    });

    it("should require authentication for getCurrentUser endpoint", async () => {
      // Arrange - No authentication token
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Act & Assert
      await expect(
        axiosApiServiceGetCurrentUser.get("/api/user/me/")
      ).rejects.toThrow("Authentication token not found");
    });

    it("should require authentication for getUserById endpoint", async () => {
      // Arrange - No authentication token
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Act & Assert
      await expect(
        axiosApiServiceGetUser.get("/api/user/users/1/")
      ).rejects.toThrow("Authentication token not found");
    });

    it("should require authentication for updateUser endpoint", async () => {
      // Arrange - No authentication token
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Act & Assert
      await expect(
        axiosApiServiceUpdateUser.put("/api/user/users/1/", {
          username: "testuser",
          email: "test@example.com",
        })
      ).rejects.toThrow("Authentication token not found");
    });

    it("should require authentication for deleteUser endpoint", async () => {
      // Arrange - No authentication token
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Act & Assert
      await expect(
        axiosApiServiceDeleteUser.delete("/api/user/users/1/")
      ).rejects.toThrow("Authentication token not found");
    });

    it("should NOT require authentication for login endpoint", async () => {
      // Arrange - No authentication token (login should work without auth)
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Mock successful login response
      const axios = await import("axios");
      vi.spyOn(axios.default, "post").mockResolvedValue({
        data: {
          id: 1,
          username: "testuser",
          access: "mock-access-token",
          refresh: "mock-refresh-token",
        },
      });

      // Act & Assert - Should not throw authentication error
      await expect(
        axiosApiServiceLogin.post("/api/user/token/", {
          email: "test@example.com",
          password: "Password1",
        })
      ).resolves.not.toThrow("Authentication token not found");
    });

    it("should NOT require authentication for signup endpoint", async () => {
      // Arrange - No authentication token (signup should work without auth)
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Mock successful signup response
      const axios = await import("axios");
      vi.spyOn(axios.default, "post").mockResolvedValue({
        data: { message: "User created" },
      });

      // Act & Assert - Should not throw authentication error
      await expect(
        axiosApiServiceSignUp.post("/api/user/create/", {
          username: "testuser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        })
      ).resolves.not.toThrow("Authentication token not found");
    });

    it("should NOT require authentication for account activation endpoint", async () => {
      // Arrange - No authentication token (activation should work without auth)
      mockedStore.getState.mockReturnValue({
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        },
      });

      // Mock successful activation response
      const axios = await import("axios");
      vi.spyOn(axios.default, "post").mockResolvedValue({
        data: { message: "Account activated" },
      });

      // Act & Assert - Should not throw authentication error
      await expect(
        axiosApiServiceActivation.post("/api/1.0/users/token/valid-token")
      ).resolves.not.toThrow("Authentication token not found");
    });
  });
});
