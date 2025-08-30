import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../locale/i18n";
import { http, HttpResponse, delay, HttpHandler } from "msw";
import { page1 } from "../tests/mocks/handlers";
import { API_ENDPOINTS } from "../services/apiEndpoints";

/**
 * Utility function to fill the sign-up form and optionally submit it.
 * @param formData - An object containing the form data.
 * @param submit - A boolean indicating whether to submit the form.
 * @param language - Optional language code (e.g., "en", "ml", "ar") to switch the form language.
 */
export const fillAndSubmitSignUpForm = async (
  formData: {
    username?: string;
    email?: string;
    password?: string;
    passwordRepeat?: string;
  },
  submit: boolean = true,
  language?: string
) => {
  // If a language is provided, change the current language.
  if (language) {
    await i18n.changeLanguage(language);
  }

  // Get the current labels from the i18n translations.
  const usernameLabel = i18n.t("signup.username");
  const emailLabel = i18n.t("signup.email");
  const passwordLabel = i18n.t("signup.password");
  const passwordRepeatLabel = i18n.t("signup.passwordRepeat");
  const submitText = i18n.t("signup.submit");

  const usernameInput = screen.getByLabelText(usernameLabel);
  const emailInput = screen.getByLabelText(emailLabel);
  const passwordInput = screen.getByLabelText(passwordLabel);
  const passwordRepeatInput = screen.getByLabelText(passwordRepeatLabel);

  if (usernameInput && formData.username) {
    await userEvent.type(usernameInput, formData.username);
  }
  if (emailInput && formData.email) {
    await userEvent.type(emailInput, formData.email);
  }
  if (passwordInput && formData.password) {
    await userEvent.type(passwordInput, formData.password);
  }
  if (passwordRepeatInput && formData.passwordRepeat) {
    await userEvent.type(passwordRepeatInput, formData.passwordRepeat);
  }

  if (submit) {
    const button = screen.getByRole("button", { name: submitText });
    await userEvent.click(button);
  }
};

/**
 * Delay mock handler for user list API endpoints
 * @param options - Configuration options
 * @param options.delayPage - Specific page number to delay
 * @param options.delayMs - Delay duration in milliseconds
 *
 * @example
 * // Delay page 1 requests by 500ms
 * server.use(createUserListHandler({ delayPage: 1, delayMs: 500 }));
 */
export const createUserListHandler = (options?: {
  delayPage?: number;
  delayMs?: number;
}): HttpHandler => {
  return http.get(API_ENDPOINTS.GET_USERS, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const size = Number(url.searchParams.get("size")) || 3;

    // Apply artificial delay for specific pages to test loading states
    if (options?.delayPage === page && options?.delayMs) {
      await delay(options.delayMs);
    }

    // Reuse mock data structure from mocks/handlers.ts for consistency
    const allUsers = [...page1.content];

    // Calculate pagination using 1-based indexing
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    return HttpResponse.json({
      results: allUsers.slice(startIndex, endIndex),
      count: allUsers.length,
    });
  });
};

/**
 * Utility function to fill the login form and optionally submit it.
 * @param formData - An object containing the form data (email and password).
 * @param submit - A boolean indicating whether to submit the form (default: true).
 * @param language - Optional language code to switch the form language.
 */
export const fillAndSubmitLoginForm = async (
  formData: {
    email?: string;
    password?: string;
  },
  submit: boolean = true,
  language?: string
) => {
  // Change language if specified
  if (language) {
    await i18n.changeLanguage(language);
  }

  // Get translated labels
  const loginEmailLabel = i18n.t("login.email");
  const loginPasswordLabel = i18n.t("login.password");
  const loginSubmitText = i18n.t("login.submit");

  // Get form elements
  const emailInput = screen.getByLabelText(loginEmailLabel);
  const passwordInput = screen.getByLabelText(loginPasswordLabel);

  // Fill form fields
  if (formData.email) {
    await userEvent.type(emailInput, formData.email);
  }
  if (formData.password) {
    await userEvent.type(passwordInput, formData.password);
  }

  // Submit form if requested
  if (submit) {
    const button = screen.getByRole("button", { name: loginSubmitText });
    await userEvent.click(button);
  }
};
