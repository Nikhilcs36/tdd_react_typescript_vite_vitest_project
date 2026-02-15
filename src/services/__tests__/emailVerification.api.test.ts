import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  axiosApiServiceVerifyEmail,
  fetchApiServiceVerifyEmail,
  axiosApiServiceResendVerification,
  fetchApiServiceResendVerification,
} from "../apiService";
import { API_ENDPOINTS } from "../apiEndpoints";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

// Mock i18n
vi.mock("../../locale/i18n", () => ({
  default: {
    language: "en",
  },
}));

// Mock store
vi.mock("../../store", () => ({
  default: {
    getState: () => ({
      auth: {
        accessToken: null,
      },
    }),
    dispatch: vi.fn(),
  },
}));

describe("Email Verification API Services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("axiosApiServiceVerifyEmail", () => {
    it("should verify email with valid token successfully", async () => {
      const mockResponse = {
        data: {
          message: "Email verified successfully. You can now log in.",
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const token = "valid-verification-token";
      const result = await axiosApiServiceVerifyEmail.post(
        API_ENDPOINTS.VERIFY_EMAIL(token)
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/user/verify-email/${token}/`,
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": "en",
          }),
        })
      );
    });

    it("should throw error when token is invalid", async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: "Invalid verification token.",
          },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      const token = "invalid-token";

      await expect(
        axiosApiServiceVerifyEmail.post(API_ENDPOINTS.VERIFY_EMAIL(token))
      ).rejects.toEqual(expect.objectContaining(mockError));
    });

    it("should throw error when token has expired", async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: "Verification token has expired. Please request a new one.",
          },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      const token = "expired-token";

      await expect(
        axiosApiServiceVerifyEmail.post(API_ENDPOINTS.VERIFY_EMAIL(token))
      ).rejects.toEqual(expect.objectContaining(mockError));
    });
  });

  describe("fetchApiServiceVerifyEmail", () => {
    it("should verify email with valid token successfully", async () => {
      const mockResponse = {
        message: "Email verified successfully. You can now log in.",
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const token = "valid-verification-token";
      const result = await fetchApiServiceVerifyEmail.post(
        API_ENDPOINTS.VERIFY_EMAIL(token)
      );

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user/verify-email/${token}/`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Accept-Language": "en",
          }),
        })
      );
    });

    it("should throw error when token is invalid", async () => {
      const mockError = {
        error: "Invalid verification token.",
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError),
      });

      const token = "invalid-token";

      await expect(
        fetchApiServiceVerifyEmail.post(API_ENDPOINTS.VERIFY_EMAIL(token))
      ).rejects.toThrow();
    });

    it("should throw error when token has expired", async () => {
      const mockError = {
        error: "Verification token has expired. Please request a new one.",
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError),
      });

      const token = "expired-token";

      await expect(
        fetchApiServiceVerifyEmail.post(API_ENDPOINTS.VERIFY_EMAIL(token))
      ).rejects.toThrow();
    });
  });

  describe("axiosApiServiceResendVerification", () => {
    it("should resend verification email successfully", async () => {
      const mockResponse = {
        data: {
          message: "Verification email sent.",
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const email = "test@example.com";
      const result = await axiosApiServiceResendVerification.post(
        API_ENDPOINTS.RESEND_VERIFICATION,
        { email }
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/user/resend-verification/",
        { email },
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": "en",
          }),
        })
      );
    });

    it("should handle errors when resending verification email", async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: "Failed to resend verification email.",
          },
        },
      };
      mockedAxios.post.mockRejectedValue(mockError);

      const email = "test@example.com";

      await expect(
        axiosApiServiceResendVerification.post(
          API_ENDPOINTS.RESEND_VERIFICATION,
          { email }
        )
      ).rejects.toEqual(expect.objectContaining(mockError));
    });
  });

  describe("fetchApiServiceResendVerification", () => {
    it("should resend verification email successfully", async () => {
      const mockResponse = {
        message: "Verification email sent.",
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const email = "test@example.com";
      const result = await fetchApiServiceResendVerification.post(
        API_ENDPOINTS.RESEND_VERIFICATION,
        { email }
      );

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/resend-verification/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "Accept-Language": "en",
          }),
          body: JSON.stringify({ email }),
        })
      );
    });

    it("should handle errors when resending verification email", async () => {
      const mockError = {
        error: "Failed to resend verification email.",
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError),
      });

      const email = "test@example.com";

      await expect(
        fetchApiServiceResendVerification.post(
          API_ENDPOINTS.RESEND_VERIFICATION,
          { email }
        )
      ).rejects.toThrow();
    });
  });
});
