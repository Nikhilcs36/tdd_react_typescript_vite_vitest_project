import { describe, expect, it, vi } from "vitest";
import { axiosApiServiceLogout, fetchApiServiceLogout } from "../apiService";
import { API_ENDPOINTS } from "../apiEndpoints";

// Mock the store module to provide valid tokens that match MSW expectations
let mockRefreshToken = "invalid_refresh_token"; // Default to invalid token

vi.mock("../../store", () => ({
  default: {
    getState: () => ({
      auth: {
        accessToken: "mock-access-token", // Matches MSW handler expectation
        refreshToken: mockRefreshToken, // Use the variable we can control
        user: null,
        isAuthenticated: false,
        showLogoutMessage: false
      }
    })
  }
}));

describe("Logout Error Handling with MSW", () => {
  describe("axiosApiServiceLogout", () => {
    it("should handle 'refresh_token_not_valid' error when invalid refresh token provided", async () => {
      // Test the actual MSW handler with invalid refresh token from store
      try {
        await axiosApiServiceLogout.post(API_ENDPOINTS.LOGOUT);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.validationErrors.detail).toBe("refresh_token_not_valid");
        expect(error.response.data.validationErrors.languageReceived).toBe("en");
      }
    });
  });

  describe("fetchApiServiceLogout", () => {
    it("should handle 'refresh_token_not_valid' error when invalid refresh token provided", async () => {
      // Test the actual MSW handler with invalid refresh token from store
      try {
        await fetchApiServiceLogout.post(API_ENDPOINTS.LOGOUT);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.validationErrors.detail).toBe("refresh_token_not_valid");
        expect(error.response.data.validationErrors.languageReceived).toBe("en");
      }
    });
  });
});
