import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createStore } from "../store";
import { loginSuccess, logoutSuccess } from "../store/authSlice";
import i18n from "../locale/i18n";
import { LoginCountdownBanner } from "./LoginCountdownBanner";

let store: ReturnType<typeof createStore>;

const renderWithStore = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </Provider>
  );
};

describe("LoginCountdownBanner", () => {
  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    act(() => {
      store.dispatch(logoutSuccess());
    });
  });

  it("renders banner when conditions are met (not granted, logins remaining > 0)", async () => {
    await act(async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "test-access-token",
          refresh: "test-refresh-token",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 2,
          staff_access_granted: false,
          active_role: "regular",
          role_label: "Regular",
        })
      );
      renderWithStore(<LoginCountdownBanner />);
    });

    expect(screen.getByTestId("login-countdown-banner")).toBeInTheDocument();
    expect(screen.getByTestId("login-countdown-text")).toHaveTextContent(
      "🎉 2 more login(s) to unlock staff access!"
    );
  });

  it("renders null when staff_access_granted is true", async () => {
    await act(async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "test-access-token",
          refresh: "test-refresh-token",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 1,
          staff_access_granted: true,
          active_role: "staff",
          role_label: "Staff",
        })
      );
      renderWithStore(<LoginCountdownBanner />);
    });

    expect(screen.queryByTestId("login-countdown-banner")).not.toBeInTheDocument();
  });

  it("renders null when logins_remaining_for_staff is 0", async () => {
    await act(async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "test-access-token",
          refresh: "test-refresh-token",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 0,
          staff_access_granted: false,
          active_role: "regular",
          role_label: "Regular",
        })
      );
      renderWithStore(<LoginCountdownBanner />);
    });

    expect(screen.queryByTestId("login-countdown-banner")).not.toBeInTheDocument();
  });

  it("renders null when user is not authenticated", async () => {
    await act(async () => {
      renderWithStore(<LoginCountdownBanner />);
    });

    expect(screen.queryByTestId("login-countdown-banner")).not.toBeInTheDocument();
  });

  it("can be dismissed and reappears on rerender", async () => {
    await act(async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          access: "test-access-token",
          refresh: "test-refresh-token",
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 3,
          staff_access_granted: false,
          active_role: "regular",
          role_label: "Regular",
        })
      );
      renderWithStore(<LoginCountdownBanner />);
    });

    expect(screen.getByTestId("login-countdown-banner")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("dismiss-banner-button"));
    });

    expect(screen.queryByTestId("login-countdown-banner")).not.toBeInTheDocument();

    // Unmount and remount - banner should reappear (since state is local)
    act(() => {
      const root = document.body.firstChild as HTMLElement;
      if (root) root.remove();
    });

    await act(async () => {
      renderWithStore(<LoginCountdownBanner />);
    });

    expect(screen.getByTestId("login-countdown-banner")).toBeInTheDocument();
  });
});
