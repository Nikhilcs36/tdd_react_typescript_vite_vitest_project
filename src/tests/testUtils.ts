import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import i18n from "../locale/i18n";

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
