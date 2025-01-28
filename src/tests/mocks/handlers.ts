import { http, HttpResponse } from "msw";
import { SignUpRequestBody, validateSignUp } from "../../utils/validationRules";

export const handlers = [
  http.post("/api/1.0/users", async ({ request }) => {
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
        },
        { status: 400 }
      );
    }

    // If no validation errors, simulate a successful response
    return HttpResponse.json({ message: "User created" }, { status: 200 });
  }),
];
