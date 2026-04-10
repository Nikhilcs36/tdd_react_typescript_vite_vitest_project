import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockSecureLS, resetSecureLSMock } from "../tests/mocks/secureLsMock";
import createSecureLSMock from "../tests/mocks/secureLsMockFactory";

// Mock secure-ls before importing the modules that use it
vi.mock("secure-ls", () => createSecureLSMock(mockSecureLS));

// Import modules that use secure-ls after the mock is set up
import { createStore } from "./index";
import { loginSuccess, logoutSuccess } from "./actions";

describe("Store with auth persistence", () => {
  beforeEach(() => {
    resetSecureLSMock();
    sessionStorage.clear();
  });

  it("should store auth state in sessionStorage and SecureLS on login", () => {
    const store = createStore();
    const testUser = {
      id: 1,
      username: "testuser",
      is_staff: false,
      is_superuser: false,
      access: "mock-access-token",
      refresh: "mock-refresh-token",
    };

    store.dispatch(loginSuccess(testUser));

    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastCall.key).toBe("authState");
    expect(lastCall.value).toMatchObject({
      isAuthenticated: true,
      user: { id: 1, username: "testuser", is_staff: false, is_superuser: false },
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      showLogoutMessage: false,
    });

    const storedSessionState = sessionStorage.getItem("authState");
    expect(storedSessionState).not.toBeNull();
    expect(JSON.parse(storedSessionState ?? "{}")).toMatchObject({
      isAuthenticated: true,
      user: { id: 1, username: "testuser", is_staff: false, is_superuser: false },
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      showLogoutMessage: false,
    });
  });

  it("should load auth state from sessionStorage on store creation", () => {
    sessionStorage.setItem(
      "authState",
      JSON.stringify({
        isAuthenticated: true,
        user: { id: 5, username: "persistedUser", is_staff: false, is_superuser: false },
        accessToken: "mock-persisted-access-token",
        refreshToken: "mock-persisted-refresh-token",
        showLogoutMessage: false,
      })
    );

    const store = createStore();

    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState).toEqual({
      isAuthenticated: true,
      user: { id: 5, username: "persistedUser", is_staff: false, is_superuser: false },
      accessToken: "mock-persisted-access-token",
      refreshToken: "mock-persisted-refresh-token",
      showLogoutMessage: false,
    });
  });

  it("should ignore invalid auth state from sessionStorage on store creation", () => {
    sessionStorage.setItem(
      "authState",
      JSON.stringify({
        invalid: true,
      })
    );

    const store = createStore();

    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(false);
    expect(loadedAuthState.user).toBeNull();
    expect(loadedAuthState.accessToken).toBeNull();
    expect(loadedAuthState.refreshToken).toBeNull();
    expect(loadedAuthState.showLogoutMessage).toBe(false);
    expect(sessionStorage.getItem("authState")).toBeNull();
  });

  it("should ignore persisted SecureLS data when sessionStorage is empty", () => {
    mockSecureLS.getReturnValue = {
      isAuthenticated: true,
      user: { id: 5, username: "persistedUser", is_staff: false, is_superuser: false },
      accessToken: "mock-persisted-access-token",
      refreshToken: "mock-persisted-refresh-token",
      showLogoutMessage: false,
    };

    const store = createStore();

    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(false);
    expect(loadedAuthState.user).toBeNull();
    expect(loadedAuthState.accessToken).toBeNull();
    expect(loadedAuthState.refreshToken).toBeNull();
    expect(loadedAuthState.showLogoutMessage).toBe(false);
  });

  it("should clear sessionStorage and SecureLS on logout", () => {
    const store = createStore();

    store.dispatch(logoutSuccess());

    expect(sessionStorage.getItem("authState")).toBeNull();
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

    store.dispatch(loginSuccess(adminUser));

    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastCall.key).toBe("authState");
    expect(lastCall.value).toMatchObject({
      isAuthenticated: true,
      user: {
        id: 2,
        username: "adminuser",
        is_staff: true,
        is_superuser: false,
      },
      accessToken: "admin-access-token",
      refreshToken: "admin-refresh-token",
      showLogoutMessage: false,
    });

    const storedSessionState = sessionStorage.getItem("authState");
    expect(storedSessionState).not.toBeNull();
    expect(JSON.parse(storedSessionState ?? "{}")).toMatchObject({
      isAuthenticated: true,
      user: {
        id: 2,
        username: "adminuser",
        is_staff: true,
        is_superuser: false,
      },
      accessToken: "admin-access-token",
      refreshToken: "admin-refresh-token",
      showLogoutMessage: false,
    });
  });
});