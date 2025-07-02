import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { expect, describe, beforeEach, it } from "vitest";
import { loginSuccess } from "../../store/actions";
import { hideLogoutMessage } from "../../store/authSlice";
import store from "../../store";
import { server } from "../../tests/mocks/server";
import { http, HttpResponse } from "msw";
import i18n from "../../locale/i18n";

describe("Logout Message Component", () => {
  beforeEach(() => {
    server.use(
      http.post("/api/1.0/logout", async () => {
        return HttpResponse.json({
          message: "You have been logged out successfully",
        });
      })
    );
  });

  it("shows and hides logout message", async () => {
    const user = userEvent.setup();
    render(<App />);

    await act(async () => {
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          token: "valid-test-token",
        })
      );
    });

    const logoutLink = await screen.findByTestId("logout-link");
    await user.click(logoutLink);

    await waitFor(
      () => expect(screen.getByTestId("logout-success-message")).toBeVisible(),
      { timeout: 3100 }
    );
    await act(async () => {
      store.dispatch(hideLogoutMessage());
    });
  });

  it("shows and hides logout message for consecutive logouts", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First login/logout
    await act(async () => {
      store.dispatch(
        loginSuccess({ id: 1, username: "user1", token: "token1" })
      );
    });
    const logoutLink1 = await screen.findByTestId("logout-link");
    await user.click(logoutLink1);
    await waitFor(
      () => expect(screen.getByTestId("logout-success-message")).toBeVisible(),
      { timeout: 3100 }
    );
    await act(async () => {
      store.dispatch(hideLogoutMessage());
    });
    // Second login/logout
    await act(async () => {
      store.dispatch(
        loginSuccess({ id: 2, username: "user2", token: "token2" })
      );
    });
    const logoutLink2 = await screen.findByTestId("logout-link");
    await user.click(logoutLink2);
    await waitFor(
      () => expect(screen.getByTestId("logout-success-message")).toBeVisible(),
      { timeout: 3100 }
    );
    await act(async () => {
      store.dispatch(hideLogoutMessage());
    });
  }, 7000);

  describe("Logout message i18n integration", () => {
    it.each([
      { lang: "en", expected: "You have been logged out successfully" },
      { lang: "ml", expected: "നിങ്ങൾ വിജയകരമായി ലോഗ് ഔട്ട് ചെയ്തു" },
      { lang: "ar", expected: "لقد تم تسجيل خروجك بنجاح" },
    ])("shows $lang message after logout flow", async ({ lang, expected }) => {
      await act(async () => {
        await i18n.changeLanguage(lang);
      });

      const user = userEvent.setup();
      render(<App />);

      await act(async () => {
        store.dispatch(
          loginSuccess({
            id: 1,
            username: "testuser",
            token: "valid-test-token",
          })
        );
      });

      const logoutLink = await screen.findByTestId("logout-link");
      await user.click(logoutLink);

      await waitFor(
        () =>
          expect(
            screen.getByTestId("logout-success-message")
          ).toHaveTextContent(expected),
        { timeout: 3000 }
      );
    });
  });
});
