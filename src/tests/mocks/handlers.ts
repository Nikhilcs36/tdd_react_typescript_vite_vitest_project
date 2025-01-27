import { http, HttpResponse } from "msw";

type SignUpRequestBody = {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
};

export const handlers = [
  http.post("/api/1.0/users", async ({ request }) => {
    // Parse and type the request body
    const body = (await request.json()) as SignUpRequestBody;

    const { username, email, password, passwordRepeat } = body;

    const validationErrors: Record<string, string> = {};

    // Validate the username
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
    } else if (email === "existing@example.com") {
      // Mock email in use check
      validationErrors.email = "E-mail in use";
    }

    // Validate the password
    if (!password) {
      validationErrors.password = "Password cannot be null";
    } else if (password.length < 6) {
      validationErrors.password = "Password must have at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      validationErrors.password =
        "Password must have at least 1 uppercase, 1 lowercase letter and 1 number";
    }

    // Validate passwordRepeat
    if (!passwordRepeat) {
      validationErrors.passwordRepeat = "password_repeat_null";
    } else if (passwordRepeat !== password) {
      validationErrors.passwordRepeat = "password_mismatch";
    }

    // If there are validation errors, return them
    if (Object.keys(validationErrors).length > 0) {
      return HttpResponse.json(
        {
          message: "Validation Failure",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // If no validation errors, simulate a successful response
    return HttpResponse.json({ message: "User created" }, { status: 200 });
  }),
];
