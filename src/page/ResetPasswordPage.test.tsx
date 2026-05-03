import { describe, expect, it } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axios from "axios";
import { vi, beforeEach } from "vitest";
import { defaultService } from "../services/defaultService";
import {
  fetchApiServiceResetPassword,
  axiosApiServiceResetPassword,
} from "../services/apiService";
import "../locale/i18n";
import i18n from "../locale/i18n";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "../store";
import ResetPasswordPageWrapper from "../page/ResetPasswordPage";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

// Mock the navigate function
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

beforeEach(async () => {
  vi.resetAllMocks();
  mockedNavigate.mockClear();
  window.localStorage.clear();

  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

// Helper function to render the component wrapped with Provider and MemoryRouter
const renderWithProviders = (component: React.ReactElement, initialRoute = "/reset-password/valid-token") => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/reset-password/:token" element={component} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe("ResetPasswordPage", () => {
  describe("Layout", () => {
    it("renders the reset password form with token in URL", () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={defaultService} />
      );

      expect(
        screen.getByRole("heading", { name: "Reset Password" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reset Password" })
      ).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("shows validation error for empty password", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={defaultService} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      await userEvent.type(passwordInput, "test");
      await userEvent.clear(passwordInput);

      await waitFor(() => {
        expect(screen.getByTestId("password-error")).toHaveTextContent(
          "Password is required."
        );
      });
    });

    it("shows validation error for password mismatch", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={defaultService} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      const passwordRepeatInput = screen.getByLabelText("Confirm Password");

      await userEvent.type(passwordInput, "NewPass123");
      await userEvent.type(passwordRepeatInput, "DifferentPass456");

      await waitFor(() => {
        expect(screen.getByTestId("passwordRepeat-error")).toHaveTextContent(
          "Passwords don't match."
        );
      });
    });
  });

  describe("Functionality", () => {
    it("shows loading state during API submission (MSW)", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={fetchApiServiceResetPassword} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      const passwordRepeatInput = screen.getByLabelText("Confirm Password");

      await userEvent.type(passwordInput, "NewPass123");
      await userEvent.type(passwordRepeatInput, "NewPass123");

      const button = screen.getByRole("button", { name: "Reset Password" });

      await userEvent.click(button);

      await waitFor(() => expect(button).toBeDisabled());
    });

    it("shows success message after password reset (MSW)", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={fetchApiServiceResetPassword} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      const passwordRepeatInput = screen.getByLabelText("Confirm Password");

      await userEvent.type(passwordInput, "NewPass123");
      await userEvent.type(passwordRepeatInput, "NewPass123");

      await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Password reset successful. You can now login with your new password."
          )
        ).toBeInTheDocument();
      });
    });

    it("shows error message for invalid/expired token (MSW)", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={fetchApiServiceResetPassword} />,
        "/reset-password/invalid-token"
      );

      const passwordInput = screen.getByLabelText("New Password");
      const passwordRepeatInput = screen.getByLabelText("Confirm Password");

      await userEvent.type(passwordInput, "NewPass123");
      await userEvent.type(passwordRepeatInput, "NewPass123");

      await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Invalid password reset token."
        );
      });
    });

    it("shows error message for generic API errors (axios mock)", async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 500, data: {} },
      });

      renderWithProviders(
        <ResetPasswordPageWrapper apiService={axiosApiServiceResetPassword} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      const passwordRepeatInput = screen.getByLabelText("Confirm Password");

      await userEvent.type(passwordInput, "NewPass123");
      await userEvent.type(passwordRepeatInput, "NewPass123");

      await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "An unexpected error occurred."
        );
      });
    });

    it("shows login link after successful reset (MSW)", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={fetchApiServiceResetPassword} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      const passwordRepeatInput = screen.getByLabelText("Confirm Password");

      await userEvent.type(passwordInput, "NewPass123");
      await userEvent.type(passwordRepeatInput, "NewPass123");

      await userEvent.click(screen.getByRole("button", { name: "Reset Password" }));

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "Go to Login" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: "Go to Login" })
        ).toHaveAttribute("href", "/login");
      });
    });

    it("validates password meets minimum requirements", async () => {
      renderWithProviders(
        <ResetPasswordPageWrapper apiService={defaultService} />
      );

      const passwordInput = screen.getByLabelText("New Password");
      await userEvent.type(passwordInput, "short");

      // Clear and re-type to trigger validation
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, "short");

      await waitFor(() => {
        expect(screen.getByTestId("password-error")).toHaveTextContent(
          "Password must be at least 6 characters."
        );
      });
    });
  });
});