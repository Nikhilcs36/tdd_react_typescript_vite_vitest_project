import { describe, expect, it, vi } from "vitest";
import { axiosApiServiceLogout, fetchApiServiceLogout } from "../apiService";
import { API_ENDPOINTS } from "../apiEndpoints";

// Mock the store module to provide valid tokens that match MSW expectations
let mockRefreshToken: string | null = "invalid_refresh_token"; // Default to invalid token

vi.mock("../../store", () => ({
  default: {
    getState: () => ({
      auth: {
        accessToken: "mock-access-token", // Matches MSW handler expectation
        refreshToken: mockRefreshToken, // Use the variable we can control
        user: null,
        isAuthenticated: false,
        showLogoutMessage: false,
      },
    }),
  },
}));

describe("Logout Error Handling with MSW", () => {
  describe("axiosApiServiceLogout", () => {
    it("should handle 'refresh_token_not_valid' error when invalid refresh token provided", async () => {
      // Test the actual MSW handler with invalid refresh token from store
      mockRefreshToken = "invalid_refresh_token";
      try {
        await axiosApiServiceLogout.post(API_ENDPOINTS.LOGOUT);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.nonFieldErrors).toContain(
          "refresh_token_not_valid"
        );
        expect(error.response.data.validationErrors.languageReceived).toBe(
          "en"
        );
      }
    });

    it("should handle 'refresh_token_required' error when refresh token is not provided", async () => {
      // Set refresh token to null to trigger the error
      mockRefreshToken = null;
      try {
        await axiosApiServiceLogout.post(API_ENDPOINTS.LOGOUT);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.validationErrors.refresh).toBe(
          "refresh_token_required"
        );
        expect(error.response.data.validationErrors.languageReceived).toBe(
          "en"
        );
      }
    });
  });

  describe("fetchApiServiceLogout", () => {
    it("should handle 'refresh_token_not_valid' error when invalid refresh token provided", async () => {
      // Test the actual MSW handler with invalid refresh token from store
      mockRefreshToken = "invalid_refresh_token";
      try {
        await fetchApiServiceLogout.post(API_ENDPOINTS.LOGOUT);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.nonFieldErrors).toContain(
          "refresh_token_not_valid"
        );
        expect(error.response.data.validationErrors.languageReceived).toBe(
          "en"
        );
      }
    });

    it("should handle 'refresh_token_required' error when refresh token is not provided", async () => {
      // Set refresh token to null to trigger the error
      mockRefreshToken = null;
      try {
        await fetchApiServiceLogout.post(API_ENDPOINTS.LOGOUT);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.validationErrors.refresh).toBe(
          "refresh_token_required"
        );
        expect(error.response.data.validationErrors.languageReceived).toBe(
          "en"
        );
      }
    });
  });
});
