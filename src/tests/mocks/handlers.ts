import { http, HttpResponse } from "msw";
import { SignUpRequestBody, validateSignUp } from "../../utils/validationRules";

// Mock API for userlist page(msw)
const page1 = {
  content: [
    {
      id: 1,
      username: "user1",
      email: "user1@mail.com",
    },
    {
      id: 2,
      username: "user2",
      email: "user2@mail.com",
    },
    {
      id: 3,
      username: "user3",
      email: "user3@mail.com",
    },
  ],
  page: 0,
  size: 3,
  totalPages: 9,
};

export const handlers = [
  // Mock API for user signup (msw) ----(1)
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

  // Mock API for account activation (msw) ----(2)
  http.post("/api/1.0/users/token/:token", async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    // Extract the token from request parameters
    const { token } = params;

    if (!token || token === "invalid") {
      return HttpResponse.json(
        { message: "Activation failed", languageReceived: acceptLanguage },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { message: "Account activated", languageReceived: acceptLanguage },
      { status: 200 }
    );
  }),

  // Mock API for userlist (msw) ----(3)
  http.get("/api/1.0/users", async ({ request }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    return HttpResponse.json(
      { ...page1, languageReceived: acceptLanguage }, // Spread page1 so it matches expected structure
      { status: 200 }
    );
  }),
];
