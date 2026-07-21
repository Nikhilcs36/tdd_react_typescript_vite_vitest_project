import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../locale/i18n";
import { http, HttpResponse, delay, HttpHandler } from "msw";
import { page1 } from "../tests/mocks/handlers";
import { API_ENDPOINTS } from "../services/apiEndpoints";

/**
 * Mock user type matching the user shape used across tests.
 */
export interface MockUser {
  id: number;
  username: string;
  access: string;
  refresh: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  logins_remaining_for_staff: number;
  staff_access_granted: boolean;
  active_role: 'regular' | 'staff' | 'superuser';
  role_label: string;
}

/**
 * Factory function to create mock user objects with sensible defaults.
 * Any provided overrides will be spread on top of the defaults.
 *
 * @param overrides - Partial user properties to override defaults.
 * @returns A complete MockUser object.
 *
 * @example
 * createMockUser({ id: 2, username: "admin", is_staff: true })
 */
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 1,
  username: "user1",
  access: "mock-jwt-access-token",
  refresh: "mock-jwt-refresh-token",
  email: "user1@mail.com",
  is_staff: false,
  is_superuser: false,
  logins_remaining_for_staff: 0,
  staff_access_granted: false,
  active_role: 'regular' as const,
  role_label: 'Regular',
  ...overrides,
});

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
    const allUsers = [...page1.results];

    // Calculate pagination using 1-based indexing
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    const totalPages = Math.ceil(allUsers.length / size);

    return HttpResponse.json({
      count: allUsers.length,
      next: page < totalPages ? `?page=${page + 1}&size=${size}` : null,
      previous: page > 1 ? `?page=${page - 1}&size=${size}` : null,
      results: allUsers.slice(startIndex, endIndex),
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