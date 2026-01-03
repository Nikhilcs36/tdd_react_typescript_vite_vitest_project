import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

//  Hoist mocks first to prevent initialization issues
const mockSecureLS = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn().mockReturnValue(null),
  remove: vi.fn(),
}));

const mockNavigate = vi.hoisted(() => vi.fn());
const mockDispatchEvent = vi.hoisted(() => vi.fn());

// Mock external dependencies before imports
vi.mock("secure-ls", () => ({
  default: vi.fn(() => mockSecureLS),
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));

vi.spyOn(window, "dispatchEvent").mockImplementation(mockDispatchEvent);

import { createStore } from "../../store";
import { loginSuccess } from "../../store/actions";
import { useLogout } from "./useLogout";
import type { ApiService } from "../../services/apiService";
import { API_ENDPOINTS } from "../../services/apiEndpoints";

describe("useLogout Hook", () => {
  let store: ReturnType<typeof createStore>;
  let mockApiService: ApiService;

  const createWrapper =
    () =>
    ({ children }: { children: ReactNode }) =>
      (
        <Provider store={store}>
          <MemoryRouter>{children}</MemoryRouter>
        </Provider>
      );

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();
    mockApiService = {
      post: vi.fn().mockResolvedValue({}),
    };

    // Set initial authenticated state
    store.dispatch(
      loginSuccess({
        id: 1,
        username: "testuser",
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        is_staff: false,
        is_superuser: false,
      })
    );
  });

  it("perform complete logout flow successfully", async () => {
    const { result } = renderHook(() => useLogout(mockApiService), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.logout();
    });

    // Verify API call and response handling
    const expectedResponse = { message: "logout_Success" };
    mockApiService.post = vi.fn().mockResolvedValue(expectedResponse);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockApiService.post).toHaveBeenCalledWith(API_ENDPOINTS.LOGOUT);

    // Verify Redux state cleanup
    await waitFor(() => {
      const { auth } = store.getState();
      expect(auth.isAuthenticated).toBe(false);
      expect(auth.user).toBeNull();
      expect(auth.accessToken).toBeNull();
      expect(auth.refreshToken).toBeNull();
    });

    // Verify SecureLS cleanup
    expect(mockSecureLS.remove).toHaveBeenCalledWith("authState");

    // Verify navigation redirect
    expect(mockNavigate).toHaveBeenCalledWith("/");

    // Verify global event dispatch
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "userListRefresh" })
    );
  });

  it("should dispatch userListRefresh event after Redux state is updated", async () => {
    const { result } = renderHook(() => useLogout(mockApiService), {
      wrapper: createWrapper(),
    });

    // Spy on setTimeout to capture the callback
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    let setTimeoutCallback: (() => void) | undefined;

    setTimeoutSpy.mockImplementation((callback: () => void) => {
      setTimeoutCallback = callback;
      return 0 as any;
    });

    await act(async () => {
      await result.current.logout();
    });

    // Verify setTimeout was called with 0ms delay
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

    // Execute the setTimeout callback to trigger the event dispatch
    if (typeof setTimeoutCallback !== "function") {
      throw new Error(
        "setTimeout callback was not captured or is not a function"
      );
    }

    await act(async () => {
      setTimeoutCallback!();
    });

    // Verify the userListRefresh event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "userListRefresh" })
    );

    // Verify Redux state is cleared
    const { auth } = store.getState();
    expect(auth.isAuthenticated).toBe(false);

    setTimeoutSpy.mockRestore();
  });
});
