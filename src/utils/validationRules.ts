export type SignUpRequestBody = {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type UserUpdateRequestBody = {
  username: string;
  email: string;
  image?: string;
};

export const validateSignUp = (
  body: SignUpRequestBody
): Record<string, string> => {
  const { username, email, password, passwordRepeat } = body;
  const validationErrors: Record<string, string> = {};

  // Mock list of existing emails
  const existingEmails = ["existing@example.com", "test@example.com"];

  // backend API validationErrors

  if (!username) {
    validationErrors.username = "Username cannot be null";
  } else if (username.length < 4 || username.length > 32) {
    validationErrors.username = "Must have min 4 and max 32 characters";
  }

  // Validate the email
  if (!email) {
    validationErrors.email = "E-mail cannot be null";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    validationErrors.email = "E-mail is not valid";
  } else if (existingEmails.includes(email)) {
    validationErrors.email = "E-mail in use";
  }

  if (!password) {
    validationErrors.password = "Password cannot be null";
  } else if (password.length < 6) {
    validationErrors.password = "Password must have at least 6 characters";
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    validationErrors.password =
      "Password must have at least 1 uppercase, 1 lowercase letter and 1 number";
  }

  if (!passwordRepeat) {
    validationErrors.passwordRepeat = "password_repeat_null";
  } else if (passwordRepeat !== password) {
    validationErrors.passwordRepeat = "password_mismatch";
  }

  return validationErrors;
};

export const validateLogin = (values: LoginRequestBody) => {
  const errors: Record<string, string> = {};

  if (!values.email) {
    errors.email = "email_required";
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "email_invalid";
  }

  if (!values.password) {
    errors.password = "password_required";
  }

  return errors;
};

/**
 * Validates user profile update data
 * @param body - The user update request body
 * @returns Object containing validation errors, if any
 */
export const validateUserUpdate = (
  body: UserUpdateRequestBody
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Validate username - similar to validateSignUp
  if (!body.username) {
    errors.username = "Username cannot be null";
  } else if (body.username.length < 4 || body.username.length > 32) {
    errors.username = "Must have min 4 and max 32 characters";
  }
  
  // Validate email - similar to validateSignUp
  if (!body.email) {
    errors.email = "E-mail cannot be null";
  } else if (!/\S+@\S+\.\S+/.test(body.email)) {
    errors.email = "E-mail is not valid";
  }
  
  // Image URL validation removed - now accepts any format
  // The image field is optional, so we only need to validate if it's provided
  
  return errors;
};
