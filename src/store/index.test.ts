import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockSecureLS, resetSecureLSMock } from "../tests/mocks/secureLsMock";
import createSecureLSMock from "../tests/mocks/secureLsMockFactory";

// Mock secure-ls before importing the modules that use it
vi.mock("secure-ls", () => createSecureLSMock(mockSecureLS));

// Import modules that use secure-ls after the mock is set up
import { createStore } from "./index";
import { loginSuccess, logoutSuccess } from "./actions";

describe("Store with SecureLS", () => {
  beforeEach(() => {
    // Reset mock data between tests
    resetSecureLSMock();
  });

  it("should use SecureLS to store auth state", () => {
    const store = createStore();
    const testUser = {
      id: 1,
      username: "testuser",
      is_staff: false,
      is_superuser: false,
      access: "mock-access-token",
      refresh: "mock-refresh-token",
    };

    // Dispatch login action
    store.dispatch(loginSuccess(testUser));

    // Verify SecureLS.set was called with correct data
    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastCall.key).toBe("authState");
    expect(lastCall.value).toMatchObject({
      isAuthenticated: true,
      user: { id: 1, username: "testuser", is_staff: false, is_superuser: false },
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    });
  });

  it("should NOT load auth state from SecureLS on store creation", () => {
    // Setup mock return value for SecureLS.get (simulating a previous login)
    mockSecureLS.getReturnValue = {
      isAuthenticated: true,
      user: { id: 5, username: "persistedUser", is_staff: false, is_superuser: false },
      accessToken: "mock-persisted-access-token",
      refreshToken: "mock-persisted-refresh-token",
    };

    // Create store - should NOT load persisted auth state
    const store = createStore();

    // Check that auth state is NOT loaded (always start unauthenticated)
    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(false);
    expect(loadedAuthState.user).toBeNull();
    expect(loadedAuthState.accessToken).toBeNull();
    expect(loadedAuthState.refreshToken).toBeNull();
  });

  it("should clear SecureLS on logout", () => {
    const store = createStore();
    // Dispatch logout action
    store.dispatch(logoutSuccess());

    // Verify SecureLS.remove was called
    expect(mockSecureLS.removeCalls).toContain("authState");
  });

  it("should persist admin user fields (is_staff and is_superuser)", () => {
    const store = createStore();
    const adminUser = {
      id: 2,
      username: "adminuser",
      is_staff: true,
      is_superuser: false,
      access: "admin-access-token",
      refresh: "admin-refresh-token",
    };

    // Dispatch login action for admin user
    store.dispatch(loginSuccess(adminUser));

    // Verify SecureLS.set was called with complete user data including admin fields
    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastCall.key).toBe("authState");
    expect(lastCall.value).toMatchObject({
      isAuthenticated: true,
      user: {
        id: 2,
        username: "adminuser",
        is_staff: true,
        is_superuser: false
      },
      accessToken: "admin-access-token",
      refreshToken: "admin-refresh-token",
    });
  });

  it("should NOT load admin user fields from SecureLS on store creation", () => {
    // Setup mock return value for SecureLS.get with admin user (simulating a previous login)
    mockSecureLS.getReturnValue = {
      isAuthenticated: true,
      user: {
        id: 3,
        username: "loadedAdmin",
        is_staff: false,
        is_superuser: true
      },
      accessToken: "loaded-admin-access",
      refreshToken: "loaded-admin-refresh",
    };

    // Create store - should NOT load persisted auth state even for admin users
    const store = createStore();

    // Check that auth state is NOT loaded
    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(false);
    expect(loadedAuthState.user).toBeNull();
    expect(loadedAuthState.accessToken).toBeNull();
    expect(loadedAuthState.refreshToken).toBeNull();
  });
});
