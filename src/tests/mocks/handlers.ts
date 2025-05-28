import { http, HttpResponse } from "msw";
import {
  LoginRequestBody,
  SignUpRequestBody,
  UserUpdateRequestBody,
  validateLogin,
  validateSignUp,
  validateUserUpdate,
} from "../../utils/validationRules";

// Mock API for userlist page(msw)
export const page1 = {
  content: [
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

  // Mock API for userlist (msw) - Authorization aware ----(3)
  http.get("/api/1.0/users", async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 0;
    const size = Number(url.searchParams.get("size")) || 3;
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");

    // For testing purposes, we'll return different user sets based on authentication
    // In a real app, this would determine which users the authenticated user can see
    let allUsers = [...page1.content]; // Default user list

    // If authenticated, filter out the authenticated user from the list
    // This simulates authorization-aware user listing where users don't see themselves
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract user ID from the custom header format: "Bearer <token>:userId:<id>"
      // For testing, we'll use a simple approach where the token contains user info
      const userIdFromHeader = request.headers.get("X-User-Id");

      if (userIdFromHeader) {
        const authenticatedUserId = Number(userIdFromHeader);
        // Filter out the authenticated user from the list
        allUsers = page1.content.filter(
          (user) => user.id !== authenticatedUserId
        );
      }
    }

    // Apply slice for pagination
    const startIndex = page * size;
    const endIndex = startIndex + size;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    return HttpResponse.json(
      {
        content: paginatedUsers,
        page,
        size,
        totalPages: Math.ceil(allUsers.length / size),
        languageReceived: acceptLanguage,
        // Include auth status for testing purposes
        authHeaderReceived: authHeader ? "Bearer [token]" : null,
      },
      { status: 200 }
    );
  }),

  // Mock API for get user by ID (msw) ----(4)
  http.get("/api/1.0/users/:id", async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const { id } = params;
    const user = page1.content.find((u) => u.id === Number(id));

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

  // Mock API for user login (msw) ----(5)
  http.post("/api/1.0/auth", async ({ request }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const body = (await request.json()) as LoginRequestBody;

    // Validate input format only
    const validationErrors = validateLogin(body);
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

    // Mock database of valid users (could be moved to a separate file)
    const validUsers = [{ email: "user@example.com", password: "Password1" }];

    // Find user by email (case-sensitive comparison)
    const user = validUsers.find((u) => u.email === body.email);

    // Security: Always return same error for invalid email/password
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        {
          message: "Invalid credentials",
          languageReceived: acceptLanguage,
        },
        { status: 401 }
      );
    }

    // Successful login
    return HttpResponse.json(
      {
        id: 1,
        username: user.email,
        token: "mock-jwt-token",
        languageReceived: acceptLanguage,
      },
      { status: 200 }
    );
  }),

  // Mock API for user profile update (msw) ----(6)
  http.put("/api/1.0/users/:id", async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const authHeader = request.headers.get("Authorization");
    const { id } = params;

    // Check authentication
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          path: `/api/1.0/users/${id}`,
          timestamp: Date.now(),
          message: "You are not authorized to update user",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = (await request.json()) as UserUpdateRequestBody;

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
    const user = page1.content.find((u) => u.id === Number(id));

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
];
