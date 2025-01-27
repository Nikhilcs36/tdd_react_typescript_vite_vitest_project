import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

/**
 * Utility function to fill the sign-up form and optionally submit it.
 * @param formData - An object containing the form data
 * @param submit - A boolean indicating whether to submit the form
 */
export const fillAndSubmitSignUpForm = async (
  formData: {
    username?: string;
    email?: string;
    password?: string;
    passwordRepeat?: string;
  },
  submit: boolean = true
) => {
  const usernameInput = screen.getByLabelText("Username");
  const emailInput = screen.getByLabelText("E-mail");
  const passwordInput = screen.getByLabelText("Password");
  const passwordRepeatInput = screen.getByLabelText("Password Repeat");

  // Check and fill Username input if present
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
    const button = screen.getByRole("button", { name: "Sign Up" });
    await userEvent.click(button);
  }
};
