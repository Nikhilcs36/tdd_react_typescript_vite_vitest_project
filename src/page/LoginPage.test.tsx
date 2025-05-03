import { describe, expect, it } from "vitest";
import LoginPage from "./LoginPage";
import { render, screen, act, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axios from "axios";
import { vi, beforeEach } from "vitest";
import { fillAndSubmitLoginForm } from "../tests/testUtils";
import {
  axiosApiServiceLogin,
  fetchApiServiceLogin,
} from "../services/apiService";
import { defaultService } from "../services/defaultService";
import "../locale/i18n";
import i18n from "../locale/i18n";
import { Form } from "./LoginPage";
import { MemoryRouter } from "react-router-dom";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(async () => {
  localStorage.clear();
  vi.resetAllMocks();
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

describe("Login Page", () => {
  describe("Layout", () => {
    it("displays required elements", () => {
      render(<LoginPage apiService={defaultService} />);
      expect(
        screen.getByRole("heading", { name: "Login" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    it("password field has password type", () => {
      render(<LoginPage apiService={defaultService} />);
      const input = screen.getByLabelText<HTMLInputElement>("Password");
      expect(input.type).toBe("password");
    });

    it("submit button is disabled initially", () => {
      render(<LoginPage apiService={defaultService} />);
      expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
    });
  });

  describe("Styling", () => {
    const formData = {
      email: "user@example.com",
      password: "ValidPass123",
    };

    it("shows disabled button styles", () => {
      render(<LoginPage apiService={defaultService} />);
      const button = screen.getByRole("button", { name: "Login" });

      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(156 163 175 / var(--tw-bg-opacity, 1))"
      );
    });

    it("shows enabled button styles when form is valid", async () => {
      render(<LoginPage apiService={defaultService} />);
      await fillAndSubmitLoginForm(formData, false);

      const button = screen.getByRole("button", { name: "Login" });
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(59 130 246 / var(--tw-bg-opacity, 1))"
      );
    });

    it("shows validation error styles", async () => {
      render(<LoginPage apiService={defaultService} />);

      const emailInput = screen.getByLabelText("E-mail");
      await userEvent.type(emailInput, "invalid");

      await waitFor(() => {
        const error = screen.getByTestId("email-error");
        expect(error).toHaveStyleRule(
          "color",
          "rgb(185 28 28 / var(--tw-text-opacity, 1))" // text-red-700
        );
      });
    });

    describe("Form Width", () => {
      const cases = [
        { lang: "ml", expected: "36rem" },
        { lang: "ar", expected: "28rem" },
        { lang: "en", expected: "24rem" },
      ];

      it.each(cases)("sets $expected for $lang", ({ lang, expected }) => {
        const { container } = render(<Form lang={lang} />);
        expect(container.firstChild).toHaveStyleRule("max-width", expected);
      });
    });
  });

  describe("Functionality", () => {
    const validCredentials = {
      email: "user@example.com",
      password: "ValidPass123",
    };

    it("enables button when form is valid", async () => {
      render(<LoginPage apiService={defaultService} />);
      await fillAndSubmitLoginForm(validCredentials, false);
      expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    });

    it("submits valid credentials", async () => {
      mockedAxios.post.mockResolvedValue({ data: { token: "test-token" } });
      render(<LoginPage apiService={axiosApiServiceLogin} />);

      await fillAndSubmitLoginForm(validCredentials);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/auth",
        validCredentials,
        expect.objectContaining({
          headers: { "Accept-Language": "en" },
        })
      );
    });

    it("disables button during submission (MSW integration test)", async () => {
      render(<LoginPage apiService={fetchApiServiceLogin} />);

      // Get button reference before submission
      const button = screen.getByRole("button", { name: "Login" });

      // Start form submission
      const submissionPromise = fillAndSubmitLoginForm(validCredentials);

      // Immediately check disabled state
      await waitFor(() => expect(button).toBeDisabled());

      // Wait for submission completion
      await submissionPromise;

      // Verify re-enable
      await waitFor(() => expect(button).toBeEnabled());
    });

    it("disables button during submission (unit test)", async () => {
      mockedAxios.post.mockResolvedValue({ data: { token: "test-token" } });

      render(<LoginPage apiService={axiosApiServiceLogin} />);

      // Start form submission and capture the promise
      const submissionPromise = fillAndSubmitLoginForm(validCredentials);

      // Immediately check button is disabled
      const button = screen.getByRole("button", { name: "Login" });
      expect(button).toBeDisabled();

      // Wait for submission completion to ensure state updates before checking enabled state
      await submissionPromise;

      // Ensure the button re-enables after submission
      await waitFor(() => expect(button).toBeEnabled());
    });

    it("handles invalid credentials", async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 401, data: { message: "Invalid credentials" } },
      });
      render(<LoginPage apiService={axiosApiServiceLogin} />);

      await fillAndSubmitLoginForm(validCredentials);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
      });
    });
  });

  describe("Validation", () => {
    it("shows email required error", async () => {
      render(<LoginPage apiService={defaultService} />);
      const emailInput = screen.getByLabelText("E-mail");

      await userEvent.type(emailInput, "test");
      await userEvent.clear(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Email is required."
        );
      });
    });

    it("shows invalid email error", async () => {
      render(<LoginPage apiService={defaultService} />);
      await fillAndSubmitLoginForm({ email: "invalid", password: "pass" });
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "Enter a valid email address."
      );
    });

    it("shows password required error", async () => {
      render(<LoginPage apiService={defaultService} />);
      const passwordInput = screen.getByLabelText("Password");

      await userEvent.type(passwordInput, "passwordtest");
      await userEvent.clear(passwordInput);

      await waitFor(() => {
        expect(screen.getByTestId("password-error")).toHaveTextContent(
          "Password is required."
        );
      });
    });
  });

  describe("Login Page - Authentication Failure", () => {
    it("displays authentication fail message", async () => {
      render(<LoginPage apiService={fetchApiServiceLogin} />);

      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "wrongpassword",
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("clears authentication fail message when password field is changed", async () => {
      render(<LoginPage apiService={fetchApiServiceLogin} />);

      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "wrongpassword",
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText("Password"), "newpass");

      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });

    it("clears authentication fail message when email field is changed", async () => {
      render(<LoginPage apiService={fetchApiServiceLogin} />);

      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "wrongpassword",
      });

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Invalid credentials"
        );
      });

      // Change email field
      await userEvent.type(screen.getByLabelText("E-mail"), "new@example.com");

      // Ensure error disappears
      await waitFor(() => {
        expect(screen.queryByTestId("api-error")).not.toBeInTheDocument();
      });
    });

    it("displays 'An unexpected error occurred.' when the API response has no error message", async () => {
      mockedAxios.post.mockRejectedValue({ response: { status: 500 } });

      render(<LoginPage apiService={axiosApiServiceLogin} />);

      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "ValidPass123",
      });

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "An unexpected error occurred."
        );
      });
    });
  });

  describe("i18n Integration", () => {
    const testCases = [
      {
        lang: "en",
        translations: {
          heading: "Login",
          emailLabel: "E-mail",
          passwordLabel: "Password",
          submit: "Login",
          errors: {
            email_required: "Email is required.",
            email_invalid: "Enter a valid email address.",
            password_required: "Password is required.",
          },
        },
      },
      {
        lang: "ml",
        translations: {
          heading: "ലോഗിൻ",
          emailLabel: "ഇമെയിൽ",
          passwordLabel: "പാസ്‌വേഡ്",
          submit: "ലോഗിൻ",
          errors: {
            email_required: "ഇമെയിൽ ആവശ്യമാണ്.",
            email_invalid: "സാധുവായ ഇമെയിൽ വിലാസം നൽകുക.",
            password_required: "പാസ്‌വേഡ് ആവശ്യമാണ്.",
          },
        },
      },
      {
        lang: "ar",
        translations: {
          heading: "تسجيل الدخول",
          emailLabel: "البريد الإلكتروني",
          passwordLabel: "كلمة المرور",
          submit: "تسجيل الدخول",
          errors: {
            email_required: "يرجى إدخال البريد الإلكتروني.",
            email_invalid: "يرجى إدخال بريد إلكتروني صحيح.",
            password_required: "يرجى إدخال كلمة المرور.",
          },
        },
      },
    ];

    beforeEach(async () => {
      await act(async () => {
        await i18n.changeLanguage("en");
      });
    });

    it.each(testCases)(
      "renders all $lang translations correctly",
      async ({ lang, translations }) => {
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        render(<LoginPage apiService={defaultService} />);

        // Test heading
        expect(
          screen.getByRole("heading", { name: translations.heading })
        ).toBeInTheDocument();

        // Test labels
        expect(
          screen.getByLabelText(translations.emailLabel)
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(translations.passwordLabel)
        ).toBeInTheDocument();

        // Test submit button
        expect(
          screen.getByRole("button", { name: translations.submit })
        ).toBeInTheDocument();
      }
    );

    it.each(testCases)(
      "displays $lang validation errors correctly",
      async ({ lang, translations }) => {
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        render(<LoginPage apiService={defaultService} />);

        // Test email validation
        const emailInput = screen.getByLabelText(translations.emailLabel);
        await userEvent.type(emailInput, "invalid");
        await userEvent.clear(emailInput);

        await waitFor(() => {
          expect(screen.getByTestId("email-error")).toHaveTextContent(
            translations.errors.email_required
          );
        });

        // Test password validation
        const passwordInput = screen.getByLabelText(translations.passwordLabel);
        await userEvent.type(passwordInput, "test");
        await userEvent.clear(passwordInput);

        await waitFor(() => {
          expect(screen.getByTestId("password-error")).toHaveTextContent(
            translations.errors.password_required
          );
        });
      }
    );

    it.each(testCases)(
      "sends $lang Accept-Language header",
      async ({ lang }) => {
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        mockedAxios.post.mockResolvedValue({ data: {} });
        render(<LoginPage apiService={axiosApiServiceLogin} />);

        await fillAndSubmitLoginForm({
          email: "user@example.com",
          password: "password",
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              "Accept-Language": lang,
            }),
          })
        );
      }
    );
  });

  describe("Login Page - Redirection", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("redirects to home page after successful login", async () => {
      render(
        <MemoryRouter>
          <LoginPage apiService={fetchApiServiceLogin} />
        </MemoryRouter>
      );

      // Test login functionality
      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "Password1",
      });

      // Verify localStorage updates
      await waitFor(() => {
        expect(localStorage.getItem("authToken")).toBe("mock-jwt-token");
        expect(localStorage.getItem("userId")).toBe("1");
      });

      // Test redirection through URL assertion
      expect(window.location.pathname).toBe("/");
    });
  });
});
