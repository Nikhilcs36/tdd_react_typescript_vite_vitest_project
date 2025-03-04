import { http, HttpResponse } from "msw";
import { SignUpRequestBody, validateSignUp } from "../../utils/validationRules";

export const handlers = [
  // Mock API for user signup
  http.post("/api/1.0/users", async ({ request }) => {
    // Capture the Accept-Language header from the request.
    const acceptLanguage = request.headers.get("Accept-Language");

    // Parse and type the request body
    const body = (await request.json()) as SignUpRequestBody;

    // Use the shared validation function form utils/validationRules
    const validationErrors = validateSignUp(body);

    // If there are validation errors, return them
    if (Object.keys(validationErrors).length > 0) {
      return HttpResponse.json(
        {
          message: "Validation Failure",
          validationErrors,
          // Optional, Accept-Language header for testing:
          languageReceived: acceptLanguage,
        },
        { status: 400 }
      );
    }
    // If no validation errors, simulate a successful response
    return HttpResponse.json(
      { message: "User created", languageReceived: acceptLanguage },
      { status: 200 }
    );
  }),

  // Mock API for account activation
  http.post("/api/1.0/users/token/:token", async ({ params }) => {
    // Extract the token from request parameters
    const { token } = params;

    // Simulate activation success if the token is not 'invalid'
    if (token === "invalid") {
      return HttpResponse.json(
        { message: "Activation Failed" },
        { status: 400 }
      );
    }

    return HttpResponse.json({ message: "Account Activated" }, { status: 200 });
  }),
];
