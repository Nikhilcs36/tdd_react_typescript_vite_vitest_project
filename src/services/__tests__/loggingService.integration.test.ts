// Integration test to verify that logError is called when API errors occur
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logError } from "../loggingService";
import { handleApiError } from "../errorService";
import { axiosApiServiceLoadUserList } from "../apiService";
import store from "../../store";

// Mock the logError function to track calls
vi.mock("../loggingService", () => ({
  logError: vi.fn(),
}));

// Mock the store to simulate authentication state
vi.mock("../../store", () => ({
  default: {
    getState: vi.fn(),
    dispatch: vi.fn(),
  },
}));

const mockedStore = store as any;

describe("Logging Service Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store mock
    mockedStore.getState.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: "testuser" },
        accessToken: "test-token",
        refreshToken: "test-refresh-token",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call logError when handleApiError processes a server error", () => {
    // Create a mock server error
    const mockError = {
      response: {
        status: 500,
        data: {
          message: "Internal server error",
        },
      },
    };

    // Process the error through handleApiError
    handleApiError(mockError);

    // Verify that logError was called
    expect(logError).toHaveBeenCalled();

    // Verify that logError was called with the original error object
    const errorCall = (logError as any).mock.calls[0][0];
    expect(errorCall).toBeDefined();
    expect(errorCall.response.status).toBe(500);
  });

  it("should call logError when authentication token is missing", async () => {
    // Mock the store to simulate missing authentication token
    mockedStore.getState.mockReturnValueOnce({
      auth: {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      },
    });

    // Attempt to call the API which should fail due to missing token
    await expect(
      axiosApiServiceLoadUserList.get("/api/user/users/", 1, 3)
    ).rejects.toThrow();

    // Verify that logError was called
    expect(logError).toHaveBeenCalled();

    // Verify that logError was called with the authentication error
    const errorCall = (logError as any).mock.calls[0][0];
    expect(errorCall).toBeDefined();
    expect(errorCall.message).toContain("Authentication token not found");
  });

  it("should call logError when handleApiError processes an error", () => {
    // Create a mock error object
    const mockError = {
      response: {
        status: 404,
        data: { message: "Not Found" },
      },
    };

    // Process the error through handleApiError
    handleApiError(mockError);

    // Verify that logError was called
    expect(logError).toHaveBeenCalled();

    // Verify that logError was called with the original error object
    const errorCall = (logError as any).mock.calls[0][0];
    expect(errorCall).toBeDefined();
    expect(errorCall.response.status).toBe(404);
  });

  it("should call logError for network errors", () => {
    // Create a network error
    const networkError = new Error("Network Error");

    // Process the error through handleApiError
    handleApiError(networkError);

    // Verify that logError was called
    expect(logError).toHaveBeenCalled();

    // Verify that logError was called with the network error
    const errorCall = (logError as any).mock.calls[0][0];
    expect(errorCall).toBeDefined();
    expect(errorCall.message).toBe("Network Error");
  });

  it("should call logError for Django-compatible error responses", () => {
    // Create a Django-style error response
    const djangoError = {
      response: {
        status: 400,
        data: {
          non_field_errors: ["Invalid credentials"],
          username: ["This field is required"],
        },
      },
    };

    // Process the error through handleApiError
    handleApiError(djangoError);

    // Verify that logError was called
    expect(logError).toHaveBeenCalled();

    // Verify that logError was called with the original error object
    const errorCall = (logError as any).mock.calls[0][0];
    expect(errorCall).toBeDefined();
    expect(errorCall.response.status).toBe(400);
  });
});
