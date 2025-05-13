import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockSecureLS, resetSecureLSMock } from "../tests/mocks/secureLsMock";
import createSecureLSMock from "../tests/mocks/secureLsMockFactory";

// Mock secure-ls before importing the modules that use it
vi.mock("secure-ls", () => createSecureLSMock(mockSecureLS));

// Import modules that use secure-ls after the mock is set up
import { createStore } from "./index";
import { loginSuccess, logout } from "./authSlice";

describe("Store with SecureLS", () => {
  beforeEach(() => {
    // Reset mock data between tests
    resetSecureLSMock();
  });

  it("should use SecureLS to store auth state", () => {
    const store = createStore();
    const testUser = { id: 1, username: "testuser" };

    // Dispatch login action
    store.dispatch(loginSuccess(testUser));

    // Verify SecureLS.set was called with correct data
    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastCall.key).toBe("authState");
    expect(lastCall.value).toMatchObject({
      isAuthenticated: true,
      user: testUser,
    });
  });

  it("should load auth state from SecureLS on store creation", () => {
    // Setup mock return value for SecureLS.get
    mockSecureLS.getReturnValue = {
      isAuthenticated: true,
      user: { id: 5, username: "persistedUser" },
    };

    // Create store which should load from SecureLS
    const store = createStore();

    // Check if auth state was loaded correctly
    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(true);
    expect(loadedAuthState.user).toEqual({ id: 5, username: "persistedUser" });
  });

  it("should clear SecureLS on logout", () => {
    const store = createStore();

    // Dispatch logout action
    store.dispatch(logout());

    // Verify SecureLS.remove was called
    expect(mockSecureLS.removeCalls).toContain("authState");
  });
});
