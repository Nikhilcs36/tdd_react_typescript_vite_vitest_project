import { http, HttpResponse } from "msw";
import { API_ENDPOINTS } from "../../services/apiEndpoints";
import {
  LoginRequestBody,
  SignUpRequestBody,
  UserUpdateRequestBody,
  validateLogin,
  validateSignUp,
  validateUserUpdate,
} from "../../utils/validationRules";

// Mock API for userlist page(msw) - Django-style pagination
export const page1 = {
  count: 7, // Total number of users
  next: "?page=2&page_size=3",
  previous: null,
  results: [
    {
      id: 1,
      username: "user1",
      email: "user1@mail.com",
      image: null,
    },
    {
      id: 2,
      username: "user2",
      email: "user2@mail.com",
      image: "https://test.com/user1.jpg",
    },
    {
      id: 3,
      username: "user3",
      email: "user3@mail.com",
      image: null,
    },
    {
      id: 4,
      username: "user4",
      email: "user4@mail.com",
      image: null,
    },
    {
      id: 5,
      username: "user5",
      email: "user5@mail.com",
      image: null,
    },
    {
      id: 6,
      username: "user6",
      email: "user6@mail.com",
      image: null,
    },
    {
      id: 7,
      username: "user7",
      email: "user7@mail.com",
      image: null,
    },
  ],
  currentPage: 1,
};

export const handlers = [
  // Mock API for user signup (msw) - Django compatible ----(1)
  http.post(API_ENDPOINTS.SIGNUP, async ({ request }) => {
    // Capture the Accept-Language header from the request.
    const acceptLanguage = request.headers.get("Accept-Language");

    // Parse and type the request body
    const body = (await request.json()) as SignUpRequestBody;

    // Use the shared validation function form utils/validationRules
    const validationErrors = validateSignUp(body);

    // If there are validation errors, return them in Django format
    if (Object.keys(validationErrors).length > 0) {
      // Convert to Django format: { field: [errorMessage] }
      const djangoValidationErrors: Record<string, string[]> = {};
      Object.keys(validationErrors).forEach((key) => {
        djangoValidationErrors[key] = [validationErrors[key]];
      });

      return HttpResponse.json(djangoValidationErrors, { status: 400 });
    }
    // If no validation errors, simulate a successful Django response
    return HttpResponse.json(
      {
        id: 1,
        username: body.username,
        email: body.email,
        image: null,
        languageReceived: acceptLanguage,
      },
      { status: 201 }
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

  // Mock API for userlist (msw) - Authorization aware ----(3)
  http.get(API_ENDPOINTS.GET_USERS, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const size = Number(url.searchParams.get("page_size")) || 3;
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");

    let allUsers = [...page1.results];

    if (authHeader && authHeader.startsWith("JWT ")) {
      const authenticatedUserId = request.headers.get(
        "X-Authenticated-User-Id"
      );
      if (authenticatedUserId) {
        allUsers = page1.results.filter(
          (user: { id: number }) => user.id !== Number(authenticatedUserId)
        );
      }
    }

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allUsers.length / size);

    return HttpResponse.json(
      {
        count: allUsers.length,
        next: page < totalPages ? `?page=${page + 1}&page_size=${size}` : null,
        previous: page > 1 ? `?page=${page - 1}&page_size=${size}` : null,
        results: paginatedUsers,
        languageReceived: acceptLanguage,
        authHeaderReceived: authHeader ? "JWT [token]" : null,
      },
      { status: 200 }
    );
  }),

  // Mock API for get user by ID (msw) ----(4)
  http.get(API_ENDPOINTS.USER_BY_ID, async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const { id } = params;
    const user = page1.results.find((u: { id: number }) => u.id === Number(id));

    if (!user) {
      return HttpResponse.json(
        { message: "User not found", languageReceived: acceptLanguage },
        { status: 404 }
      );
    }

    return HttpResponse.json(
      { ...user, languageReceived: acceptLanguage },
      { status: 200 }
    );
  }),

  // Mock API for get current user (me endpoint) ----(4.1)
  http.get(API_ENDPOINTS.ME, async ({ request }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        {
          message: "Token is invalid or expired",
          languageReceived: acceptLanguage,
        },
        { status: 401 }
      );
    }

    // For the ME endpoint, return the first user as the current user
    const currentUser = page1.results[0];

    if (!currentUser) {
      return HttpResponse.json(
        { message: "User not found", languageReceived: acceptLanguage },
        { status: 404 }
      );
    }

    return HttpResponse.json(
      { ...currentUser, languageReceived: acceptLanguage },
      { status: 200 }
    );
  }),

  // Mock API for user login (msw) ----(5)
  http.post(API_ENDPOINTS.LOGIN, async ({ request }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const body = (await request.json()) as LoginRequestBody;

    // Validate input format only
    const validationErrors = validateLogin(body);
    if (Object.keys(validationErrors).length > 0) {
      // Convert to Django format: { field: [errorMessage] }
      const djangoValidationErrors: Record<string, string[]> = {};
      Object.keys(validationErrors).forEach((key) => {
        djangoValidationErrors[key] = [validationErrors[key]];
      });
      return HttpResponse.json(djangoValidationErrors, { status: 400 });
    }

    // Handle empty fields (Django returns field-specific errors)
    if (!body.email || !body.password) {
      const emptyFieldErrors: Record<string, string[]> = {};
      if (!body.email) emptyFieldErrors.email = ["email_required"];
      if (!body.password) emptyFieldErrors.password = ["password_required"];
      return HttpResponse.json(emptyFieldErrors, { status: 400 });
    }

    // Mock database of valid users (could be moved to a separate file)
    const validUsers = [
      {
        email: "user@example.com",
        password: "Password1",
        username: "testuser",
      },
    ];

    // Find user by email (case-sensitive comparison)
    const user = validUsers.find((u) => u.email === body.email);

    // Security: Always return same error for invalid email/password
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        {
          non_field_errors: ["no_active_account"],
          languageReceived: acceptLanguage,
        },
        { status: 400 }
      );
    }

    // Successful login
    return HttpResponse.json(
      {
        id: 1,
        username: user.username,
        email: user.email,
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        languageReceived: acceptLanguage,
      },
      { status: 200 }
    );
  }),

  // Mock API for user profile update (msw) ----(6)
  http.put(API_ENDPOINTS.USER_BY_ID, async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");
    const { id } = params;

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        {
          path: `/api/1.0/users/${id}`,
          timestamp: Date.now(),
          message: "You are not authorized to update user",
        },
        { status: 403 }
      );
    }

    // Check if this is a multipart/form-data request (file upload)
    const contentType = request.headers.get("Content-Type");
    let body: UserUpdateRequestBody;

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload - parse FormData
      const formData = await request.formData();
      body = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        image: (formData.get("image") as string | null) || undefined,
      };
    } else {
      // Handle regular JSON request
      body = (await request.json()) as UserUpdateRequestBody;
    }

    // Use the centralized validation function from utils/validationRules
    const validationErrors = validateUserUpdate(body);
    if (Object.keys(validationErrors).length > 0) {
      return HttpResponse.json(
        {
          message: "Validation Failure",
          validationErrors,
          languageReceived: acceptLanguage,
        },
        { status: 400 }
      );
    }

    // Find user in mock data
    const user = page1.results.find((u: { id: number }) => u.id === Number(id));

    if (!user) {
      return HttpResponse.json(
        { message: "User not found", languageReceived: acceptLanguage },
        { status: 404 }
      );
    }

    // Update user data (in a real app, this would update the database)
    const updatedUser = {
      ...user,
      username: body.username,
      email: body.email,
      image: body.image || null,
    };

    // Return updated user
    return HttpResponse.json(
      { ...updatedUser, languageReceived: acceptLanguage },
      { status: 200 }
    );
  }),

  // Mock API for user logout (msw) - Authorization aware ----(7)
  http.post(API_ENDPOINTS.LOGOUT, async ({ request }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");

    // Check if user is authenticated (has valid authorization header with valid token)
    if (
      !authHeader ||
      !authHeader.startsWith("JWT ") ||
      authHeader.replace("JWT ", "") !== "mock-access-token"
    ) {
      return HttpResponse.json(
        {
          message: "Token is invalid or expired",
          languageReceived: acceptLanguage,
        },
        { status: 401 }
      );
    }

    // Validate refresh token in request body
    const body = (await request.json()) as { refresh?: string };
    const refreshToken = body?.refresh;

    if (!refreshToken || refreshToken !== "mock-refresh-token") {
      return HttpResponse.json(
        {
          refresh: ["refresh_token_required"],
          languageReceived: acceptLanguage,
        },
        { status: 400 }
      );
    }

    // Successful logout - Django backend returns a success message
    return HttpResponse.json({ message: "logout_Success" }, { status: 200 });
  }),

  // Mock API for token refresh ----(8)
  http.post("/api/user/token/refresh/", async ({ request }) => {
    const body = (await request.json()) as { refresh?: string };
    const refreshToken = body?.refresh;

    if (!refreshToken || refreshToken !== "mock-refresh-token") {
      return HttpResponse.json(
        {
          message: "Invalid refresh token",
        },
        { status: 401 }
      );
    }

    // Return new access token and optionally new refresh token
    return HttpResponse.json(
      {
        access: "new-mock-access-token",
        refresh: "new-mock-refresh-token",
      },
      { status: 200 }
    );
  }),

  // Mock API for user deletion (msw) ----(9)
  http.delete(API_ENDPOINTS.USER_BY_ID, async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");
    const { id } = params;

    // Check authentication with token validation
    if (!authHeader?.startsWith("JWT ")) {
      return HttpResponse.json(
        {
          message: "Token is invalid or expired",
          languageReceived: acceptLanguage,
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("JWT ", "");
    if (accessToken !== "mock-access-token") {
      return HttpResponse.json(
        {
          message: "Token is invalid or expired",
          languageReceived: acceptLanguage,
        },
        { status: 401 }
      );
    }

    // Find user in mock data
    const user = page1.results.find((u: { id: number }) => u.id === Number(id));

    if (!user) {
      return HttpResponse.json(
        { message: "User not found", languageReceived: acceptLanguage },
        { status: 404 }
      );
    }

    // Simulate user deletion to match the real API (200 OK with a body)
    // The body can be an empty object or a success message.
    return HttpResponse.json(
      { message: "User deleted successfully" },
      {
        status: 200,
      }
    );
  }),
];
