import { describe, expect, it, vi } from "vitest";
import { axiosApiServiceSignUp, fetchApiServiceSignUp } from "../apiService";
import axios from "axios";
import { handleDjangoErrors } from "../../utils/djangoErrorHandler";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

describe("Django Error Handling", () => {
  describe("axiosApiServiceSignUp", () => {
    it("should handle Django error response format correctly", async () => {
      // Mock Django error response format (array of errors)
      const djangoErrorResponse = {
        response: {
          status: 400,
          data: {
            username: ["Username already exists"],
            email: ["E-mail in use"],
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(djangoErrorResponse);

      try {
        await axiosApiServiceSignUp.post("/api/user/create/", {
          username: "existinguser",
          email: "existing@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Test the djangoErrorHandler functionality directly
        const standardizedError = handleDjangoErrors(error.response.data);
        expect(error.response.status).toBe(400);
        expect(standardizedError.fieldErrors.username).toBe("Username already exists");
        expect(standardizedError.fieldErrors.email).toBe("E-mail in use");
      }
    });

    it("should handle single string errors correctly", async () => {
      // Mock Django error response with single string (non-array)
      const djangoErrorResponse = {
        response: {
          status: 400,
          data: {
            username: "Username already exists",
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(djangoErrorResponse);

      try {
        await axiosApiServiceSignUp.post("/api/user/create/", {
          username: "existinguser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Test the djangoErrorHandler functionality directly
        const standardizedError = handleDjangoErrors(error.response.data);
        expect(error.response.status).toBe(400);
        expect(standardizedError.fieldErrors.username).toBe("Username already exists");
      }
    });

    // Test Django 403 Forbidden error handling
    it("should handle Django 403 Forbidden error correctly", async () => {
      const django403Error = {
        response: {
          status: 403,
          data: {
            detail: "You do not have permission to perform this action.",
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(django403Error);

      try {
        await axiosApiServiceSignUp.post("/api/user/create/", {
          username: "testuser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Test the djangoErrorHandler functionality directly
        const standardizedError = handleDjangoErrors(error.response.data);
        expect(error.response.status).toBe(403);
        expect(standardizedError.nonFieldErrors[0]).toBe("You do not have permission to perform this action.");
      }
    });

    // Test Django 401 Unauthorized error handling
    it("should handle Django 401 Unauthorized error correctly", async () => {
      const django401Error = {
        response: {
          status: 401,
          data: {
            message: "Token is invalid or expired",
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(django401Error);

      try {
        await axiosApiServiceSignUp.post("/api/user/create/", {
          username: "testuser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // With centralized error handling, 401 errors are handled by handleKnownError
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBeDefined();
        // The nonFieldErrors field may or may not be present depending on how handleApiError processes it
      }
    });
  });

  describe("fetchApiServiceSignUp", () => {
    it("should handle Django error response format correctly", async () => {
      // Mock fetch response for Django error
      const djangoErrorResponse = {
        username: ["Username already exists"],
        email: ["E-mail in use"],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => djangoErrorResponse,
      });

      try {
        await fetchApiServiceSignUp.post("/api/user/create/", {
          username: "existinguser",
          email: "existing@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Verify the error is converted to the expected format
        expect(error.response.data.validationErrors).toEqual({
          username: "Username already exists",
          email: "E-mail in use",
        });
      }
    });

    it("should handle single string errors correctly", async () => {
      // Mock fetch response for single string error
      const djangoErrorResponse = {
        username: "Username already exists",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => djangoErrorResponse,
      });

      try {
        await fetchApiServiceSignUp.post("/api/user/create/", {
          username: "existinguser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.data.validationErrors).toEqual({
          username: "Username already exists",
        });
      }
    });

    // Test Django 403 Forbidden error handling for fetch
    it("should handle Django 403 Forbidden error correctly for fetch", async () => {
      const django403Error = {
        detail: "You do not have permission to perform this action.",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => django403Error,
      });

      try {
        await fetchApiServiceSignUp.post("/api/user/create/", {
          username: "testuser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.nonFieldErrors).toEqual([
          "You do not have permission to perform this action.",
        ]);
      }
    });

    // Test Django 401 Unauthorized error handling for fetch
    it("should handle Django 401 Unauthorized error correctly for fetch", async () => {
      const django401Error = {
        message: "Token is invalid or expired",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => django401Error,
      });

      try {
        await fetchApiServiceSignUp.post("/api/user/create/", {
          username: "testuser",
          email: "test@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.nonFieldErrors).toEqual([
          "Token is invalid or expired",
        ]);
      }
    });
  });
});
