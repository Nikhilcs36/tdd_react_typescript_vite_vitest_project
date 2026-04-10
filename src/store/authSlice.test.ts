import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockSecureLS, resetSecureLSMock } from "../tests/mocks/secureLsMock";
import createSecureLSMock from "../tests/mocks/secureLsMockFactory";

// Mock secure-ls before importing the modules that use it
vi.mock("secure-ls", () => createSecureLSMock(mockSecureLS));

// Import modules that use secure-ls after the mock is set up
import { loginSuccess, logoutSuccess } from "./actions";
import { createStore } from "./index";

describe("Auth Slice", () => {
  beforeEach(() => {
    resetSecureLSMock();
    sessionStorage.clear();
  });

  it("should properly clear auth state and session storage on logout", async () => {
    // Setup: Create store and login a user
    const store = createStore();
    const testUser = { id: 1, username: "testuser", is_staff: false, is_superuser: false };

    // Dispatch login action
    store.dispatch(
      loginSuccess({
        ...testUser,
        access: "test-access-token",
        refresh: "test-refresh-token",
      })
    );

    // Verify user is logged in
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toEqual(testUser);

    // Verify SecureLS.set was called with auth state
    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastSetCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastSetCall.key).toBe("authState");

    // Now logout
    store.dispatch(logoutSuccess());

    // Verify auth state is cleared
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();

    // Verify SecureLS.remove was called to clear stored auth data
    expect(mockSecureLS.removeCalls).toContain("authState");

    // Create a new store to verify no auth data is loaded from SecureLS
    mockSecureLS.getReturnValue = null; // Simulate empty storage
    const newStore = createStore();

    // Verify new store has no auth data
    expect(newStore.getState().auth.isAuthenticated).toBe(false);
    expect(newStore.getState().auth.user).toBeNull();
  });

  it("should store tokens in SecureLS and restore auth state from session storage on store creation", () => {
    const store = createStore();
    const testUser = { id: 1, username: "testuser", is_staff: false, is_superuser: false };
    const testAccessToken = "test-access-token";
    const testRefreshToken = "test-refresh-token";

    store.dispatch(
      loginSuccess({
        ...testUser,
        access: testAccessToken,
        refresh: testRefreshToken,
      })
    );

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toEqual(testUser);
    expect(store.getState().auth.accessToken).toBe(testAccessToken);
    expect(store.getState().auth.refreshToken).toBe(testRefreshToken);

    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastSetCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastSetCall.key).toBe("authState");
    expect(lastSetCall.value).toMatchObject({
      isAuthenticated: true,
      user: testUser,
      accessToken: testAccessToken,
      refreshToken: testRefreshToken,
      showLogoutMessage: false,
    });

    const storedSessionState = sessionStorage.getItem("authState");
    expect(storedSessionState).not.toBeNull();
    expect(JSON.parse(storedSessionState ?? "{}")).toMatchObject({
      isAuthenticated: true,
      user: testUser,
      accessToken: testAccessToken,
      refreshToken: testRefreshToken,
      showLogoutMessage: false,
    });

    const newStore = createStore();

    const loadedAuthState = newStore.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(true);
    expect(loadedAuthState.user).toEqual(testUser);
    expect(loadedAuthState.accessToken).toBe(testAccessToken);
    expect(loadedAuthState.refreshToken).toBe(testRefreshToken);
    expect(loadedAuthState.showLogoutMessage).toBe(false);
  });
});
