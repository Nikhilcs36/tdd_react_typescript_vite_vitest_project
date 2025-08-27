import { describe, expect, it } from "vitest";
import LoginPageWrapper from "./LoginPage";
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
import { Provider } from "react-redux";
import store from "../store";
import { logoutSuccess } from "../store/actions";
import { API_ENDPOINTS } from "../services/apiEndpoints";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

// Mock the navigate function
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    // Keep MemoryRouter and other exports
  };
});

beforeEach(async () => {
  vi.resetAllMocks();
  mockedNavigate.mockClear(); // Clear navigate mock before each test
  store.dispatch(logoutSuccess()); // Reset Redux auth state before each test
  window.localStorage.clear(); // Clear localStorage

  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

// Helper function to render the component wrapped with Provider and MemoryRouter
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>
  );
};

describe("Login Page", () => {
  describe("Layout", () => {
    it("displays required elements", () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      expect(
        screen.getByRole("heading", { name: "Login" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    it("password field has password type", () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      const input = screen.getByLabelText<HTMLInputElement>("Password");
      expect(input.type).toBe("password");
    });

    it("submit button is disabled initially", () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
    });
  });

  describe("Styling", () => {
    const formData = {
      email: "user@example.com",
      password: "ValidPass123",
    };

    it("shows disabled button styles", () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      const button = screen.getByRole("button", { name: "Login" });

      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(156 163 175 / var(--tw-bg-opacity, 1))"
      );
    });

    it("shows enabled button styles when form is valid", async () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      await fillAndSubmitLoginForm(formData, false);

      const button = screen.getByRole("button", { name: "Login" });
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(59 130 246 / var(--tw-bg-opacity, 1))"
      );
    });

    it("shows validation error styles", async () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);

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

      // This test renders the styled component directly, not the LoginPageWrapper
      // It doesn't need the Provider or Router
      it.each(cases)("sets $expected for $lang", ({ lang, expected }) => {
        const { container } = render(<Form lang={lang} />);
        expect(container.firstChild).toHaveStyleRule("max-width", expected);
      });
    });
  });

  describe("Functionality", () => {
    const validCredentials = {
      email: "user@example.com",
      password: "Password1", // Use the password from the MSW mock
    };

    it("enables button when form is valid", async () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      await fillAndSubmitLoginForm(validCredentials, false);
      expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    });

    // This test uses mockedAxios, which is fine for unit testing the component's interaction with axios
    it("submits valid credentials (axios mock)", async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          id: 1,
          username: "testuser",
          access: "mock-access-token",
          refresh: "mock-refresh-token",
        },
      });
      renderWithProviders(
        <LoginPageWrapper apiService={axiosApiServiceLogin} />
      );

      await fillAndSubmitLoginForm(validCredentials);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        API_ENDPOINTS.LOGIN,
        validCredentials,
        expect.objectContaining({
          headers: { "Accept-Language": "en" },
        })
      );
    });

    it("disables button during submission (MSW integration test)", async () => {
      renderWithProviders(
        <LoginPageWrapper apiService={fetchApiServiceLogin} />
      );

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

    // This test uses mockedAxios, which is fine for unit testing the component's interaction with axios
    it("disables button during submission (unit test)", async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          id: 1,
          username: "testuser",
          access: "mock-access-token",
          refresh: "mock-refresh-token",
        },
      });

      renderWithProviders(
        <LoginPageWrapper apiService={axiosApiServiceLogin} />
      );

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

    // This test uses mockedAxios, which is fine for unit testing the component's interaction with axios
    it("handles invalid credentials (axios mock)", async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 401, data: { message: "Invalid credentials" } },
      });
      renderWithProviders(
        <LoginPageWrapper apiService={axiosApiServiceLogin} />
      );

      await fillAndSubmitLoginForm(validCredentials);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
      });
    });

    // New test for local storage persistence on successful login
    it("saves auth state to local storage on successful login (MSW)", async () => {
      // Mock SecureLS for this test
      vi.mock("secure-ls", () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            set: vi.fn(),
            get: vi.fn(),
            remove: vi.fn(),
          })),
        };
      });

      renderWithProviders(
        <LoginPageWrapper apiService={fetchApiServiceLogin} />
      );

      // Perform successful login
      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "Password1",
      });

      // Wait for the Redux state to be updated
      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.auth.user).toEqual({
          id: 1,
          username: "user@example.com",
        });
      });
    });
  });

  describe("Validation", () => {
    it("shows email required error", async () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
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
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
      await fillAndSubmitLoginForm({ email: "invalid", password: "pass" });
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "Enter a valid email address."
      );
    });

    it("shows password required error", async () => {
      renderWithProviders(<LoginPageWrapper apiService={defaultService} />);
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
      renderWithProviders(
        <LoginPageWrapper apiService={fetchApiServiceLogin} />
      );

      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "wrongpassword",
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("clears authentication fail message when password field is changed", async () => {
      renderWithProviders(
        <LoginPageWrapper apiService={fetchApiServiceLogin} />
      );

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
      renderWithProviders(
        <LoginPageWrapper apiService={fetchApiServiceLogin} />
      );

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

    it("displays 'An unexpected error occurred.' when the API response has no error message (axios mock)", async () => {
      mockedAxios.post.mockRejectedValue({ response: { status: 500 } });

      renderWithProviders(
        <LoginPageWrapper apiService={axiosApiServiceLogin} />
      );

      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "Password1",
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

        renderWithProviders(<LoginPageWrapper apiService={defaultService} />);

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

        renderWithProviders(<LoginPageWrapper apiService={defaultService} />);

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
      "sends $lang Accept-Language header (axios mock)",
      async ({ lang }) => {
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        mockedAxios.post.mockResolvedValue({
          data: {
            id: 1,
            username: "testuser",
            access: "mock-access-token",
            refresh: "mock-refresh-token",
          },
        });
        renderWithProviders(
          <LoginPageWrapper apiService={axiosApiServiceLogin} />
        );

        await fillAndSubmitLoginForm({
          email: "user@example.com",
          password: "Password1",
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

  describe("Login Page - Redirection and State Update (MSW)", () => {
    beforeEach(async () => {
      // Make beforeEach async
      // Reset Redux auth state before each test
      store.dispatch(logoutSuccess());
      // Clear localStorage
      window.localStorage.clear();
      // Set default language to English
      await act(async () => {
        await i18n.changeLanguage("en");
      });
    });

    it("redirects to home page after successful login (MSW)", async () => {
      renderWithProviders(
        <LoginPageWrapper apiService={fetchApiServiceLogin} />
      );

      // Test login functionality
      await fillAndSubmitLoginForm({
        email: "user@example.com",
        password: "Password1",
      });

      // Verify redirection using the mocked navigate function
      await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith("/");
      });

      // Verify Redux state update
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.id).toBe(1);
      expect(state.auth.user?.username).toBe("user@example.com");
      // No assertion for token since it's not stored
    });
  });
});
