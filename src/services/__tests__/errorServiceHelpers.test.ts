import { describe, expect, it } from "vitest";
import { hasDjangoErrorStructure, processDjangoError, buildErrorResponse } from "../errorService";

describe("Error Service Helper Functions - Real World Scenarios", () => {
  describe("hasDjangoErrorStructure", () => {
    it("should return true for Django 401 error structure", () => {
      const djangoError = {
        nonFieldErrors: ["Token is invalid or expired"],
        validationErrors: {},
      };
      expect(hasDjangoErrorStructure(djangoError)).toBe(true);
    });

    it("should return true for Django 403 error structure", () => {
      const djangoError = {
        nonFieldErrors: ["You do not have permission to perform this action."],
        validationErrors: {},
      };
      expect(hasDjangoErrorStructure(djangoError)).toBe(true);
    });

    it("should return false for Axios network error structure", () => {
      const networkError = {
        message: "Network Error",
        name: "AxiosError",
        code: "ERR_NETWORK",
      };
      expect(hasDjangoErrorStructure(networkError)).toBe(false);
    });

    it("should return false for empty objects", () => {
      expect(hasDjangoErrorStructure({})).toBe(false);
    });
  });

  describe("processDjangoError", () => {
    it("should process Django 401 error correctly", () => {
      const djangoError = {
        non_field_errors: ["Token is invalid or expired"],
      };
      const result = processDjangoError(djangoError);
      
      expect(result.fieldErrors).toEqual({});
      expect(result.nonFieldErrors).toEqual(["Token is invalid or expired"]);
      expect(result.hasErrors).toBe(true);
    });

    it("should process Django 403 error correctly", () => {
      const djangoError = {
        non_field_errors: ["You do not have permission to perform this action."],
      };
      const result = processDjangoError(djangoError);
      
      expect(result.fieldErrors).toEqual({});
      expect(result.nonFieldErrors).toEqual(["You do not have permission to perform this action."]);
      expect(result.hasErrors).toBe(true);
    });

    it("should return empty result for network errors", () => {
      const networkError = {
        message: "Network Error",
        name: "AxiosError",
        code: "ERR_NETWORK",
      };
      const result = processDjangoError(networkError);
      
      expect(result.fieldErrors).toEqual({});
      expect(result.nonFieldErrors).toEqual([]);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe("buildErrorResponse", () => {
    it("should build error response for 401 error with original error preserved", () => {
      const backendError = {
        nonFieldErrors: ["Token is invalid or expired"],
        validationErrors: {},
      };
      const response = buildErrorResponse({
        status: 401,
        message: "Your session has expired. Please log in again.",
        originalError: backendError,
      });
      
      expect(response.response.status).toBe(401);
      expect(response.response.data.message).toBe("Your session has expired. Please log in again.");
      expect(response.response.data.originalError).toEqual(backendError);
    });

    it("should build error response for 403 error with original error preserved", () => {
      const backendError = {
        nonFieldErrors: ["You do not have permission to perform this action."],
        validationErrors: {},
      };
      const response = buildErrorResponse({
        status: 403,
        message: "You don't have permission to perform this action.",
        originalError: backendError,
      });
      
      expect(response.response.status).toBe(403);
      expect(response.response.data.message).toBe("You don't have permission to perform this action.");
      expect(response.response.data.originalError).toEqual(backendError);
    });

    it("should build error response for network error", () => {
      const networkError = {
        message: "Network Error",
        name: "AxiosError",
        code: "ERR_NETWORK",
      };
      const response = buildErrorResponse({
        status: 0,
        message: "Network connection failed. Please check your internet connection.",
        originalError: networkError,
      });
      
      expect(response.response.status).toBe(0);
      expect(response.response.data.message).toBe("Network connection failed. Please check your internet connection.");
      expect(response.response.data.originalError).toEqual(networkError);
    });

    it("should build error response without originalError when not provided", () => {
      const response = buildErrorResponse({
        status: 500,
        message: "Something went wrong on our end. Please try again later.",
      });
      
      expect(response.response.status).toBe(500);
      expect(response.response.data.message).toBe("Something went wrong on our end. Please try again later.");
      expect(response.response.data.originalError).toBeUndefined();
    });
  });
});
