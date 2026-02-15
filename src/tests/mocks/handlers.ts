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
    const size = Number(url.searchParams.get("size")) || 3;
    const authHeader = request.headers.get("Authorization");

    // Check authentication - return 401 Unauthorized if no valid token
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    // Check authorization - return 403 Forbidden for specific scenarios
    // For example, if trying to access page beyond what's allowed
    if (page > 3) {
      return HttpResponse.json(
        { detail: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

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

    // Build full URLs for next and previous links to match Django backend
    const baseUrl = "http://127.0.0.1:8000/api/user/users/";
    const nextUrl =
      page < totalPages
        ? `${baseUrl}?page=${page + 1}&size=${size}`
        : null;
    const previousUrl =
      page > 1 ? `${baseUrl}?page=${page - 1}&size=${size}` : null;

    return HttpResponse.json(
      {
        count: allUsers.length,
        next: nextUrl,
        previous: previousUrl,
        results: paginatedUsers,
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

    // For the ME endpoint, return a specific user to match the Django backend response
    const currentUser = {
      id: 13,
      username: "test002",
      email: "test002@gmail.com",
      image: null,
    };

    return HttpResponse.json(currentUser, { status: 200 });
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

    if (!refreshToken) {
      return HttpResponse.json(
        {
          refresh: ["refresh_token_required"],
          languageReceived: acceptLanguage,
        },
        { status: 400 }
      );
    }

    if (refreshToken !== "mock-refresh-token") {
      return HttpResponse.json(
        {
          detail: "refresh_token_not_valid",
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

  // Mock API for user dashboard stats ----(10)
  http.get(API_ENDPOINTS.USER_STATS, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        total_logins: 39,
        last_login: "2026-01-03 09:35:14",
        weekly_data: {
          "2025-50": 4,
          "2025-51": 20,
          "2025-52": 15
        },
        monthly_data: {
          "2025-12": 26,
          "2026-01": 13
        },
        login_trend: -50
      },
      { status: 200 }
    );
  }),

  // Mock API for login activity ----(11)
  http.get(API_ENDPOINTS.LOGIN_ACTIVITY, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const size = Number(url.searchParams.get("size")) || 10;
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    const allActivities = [
      {
        id: 66,
        username: "admin",
        timestamp: "2026-01-03 09:36:18",
        ip_address: "172.18.0.1",
        user_agent: "PostmanRuntime/7.51.0",
        success: true
      },
      {
        id: 65,
        username: "admin",
        timestamp: "2026-01-03 09:35:14",
        ip_address: "172.18.0.1",
        user_agent: "PostmanRuntime/7.51.0",
        success: true
      },
      {
        id: 64,
        username: "admin",
        timestamp: "2026-01-03 09:27:24",
        ip_address: "172.18.0.1",
        user_agent: "PostmanRuntime/7.51.0",
        success: true
      }
    ];

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedActivities = allActivities.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allActivities.length / size);
    const baseUrl = "http://127.0.0.1:8000/api/user/dashboard/login-activity/";
    const nextUrl = page < totalPages ? `${baseUrl}?page=${page + 1}&size=${size}` : null;
    const previousUrl = page > 1 ? `${baseUrl}?page=${page - 1}&size=${size}` : null;

    return HttpResponse.json(
      {
        count: allActivities.length,
        next: nextUrl,
        previous: previousUrl,
        results: paginatedActivities
      },
      { status: 200 }
    );
  }),

  // Mock API for login trends chart ----(12)
  http.get(API_ENDPOINTS.LOGIN_TRENDS, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        "login_trends": {
          "labels": [
            "2025-12-04",
            "2025-12-05",
            "2025-12-06",
            "2025-12-07",
            "2025-12-08",
            "2025-12-09",
            "2025-12-10",
            "2025-12-11",
            "2025-12-12",
            "2025-12-13",
            "2025-12-14",
            "2025-12-15",
            "2025-12-16",
            "2025-12-17",
            "2025-12-18",
            "2025-12-19",
            "2025-12-20",
            "2025-12-21",
            "2025-12-22",
            "2025-12-23",
            "2025-12-24",
            "2025-12-25",
            "2025-12-26",
            "2025-12-27",
            "2025-12-28",
            "2025-12-29",
            "2025-12-30",
            "2025-12-31",
            "2026-01-01",
            "2026-01-02",
            "2026-01-03"
          ],
          "datasets": [
            {
              "label": "Successful Logins",
              "data": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                2,
                2,
                0,
                2,
                8,
                7,
                0,
                1,
                0,
                2,
                1,
                0,
                1,
                0,
                7,
                14
              ],
              "borderColor": "#4caf50",
              "backgroundColor": "rgba(76, 175, 80, 0.1)"
            },
            {
              "label": "Failed Logins",
              "data": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1
              ],
              "borderColor": "#f44336",
              "backgroundColor": "rgba(244, 67, 54, 0.1)"
            }
          ]
        }
      },
      { status: 200 }
    );
  }),

  // Mock API for login comparison chart ----(13)
  http.get(API_ENDPOINTS.LOGIN_COMPARISON, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        "login_comparison": {
          "labels": [
            "2025-12-15",
            "2025-12-22",
            "2025-12-29"
          ],
          "datasets": [
            {
              "label": "Login Count",
              "data": [
                4,
                20,
                23
              ],
              "backgroundColor": "#2196f3"
            }
          ]
        }
      },
      { status: 200 }
    );
  }),

  // Mock API for login distribution chart ----(14)
  http.get(API_ENDPOINTS.LOGIN_DISTRIBUTION, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        "login_distribution": {
          "success_ratio": {
            "labels": [
              "Successful",
              "Failed"
            ],
            "datasets": [
              {
                "data": [
                  47,
                  3
                ],
                "backgroundColor": [
                  "#4caf50",
                  "#f44336"
                ]
              }
            ]
          },
          "user_agents": {
            "labels": [
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
              "PostmanRuntime/7.51.0",
              "PostmanRuntime/7.49.1"
            ],
            "datasets": [
              {
                "data": [
                  30,
                  17,
                  3
                ],
                "backgroundColor": [
                  "#2196f3",
                  "#4caf50",
                  "#ff9800",
                  "#9c27b0",
                  "#607d8b"
                ]
              }
            ]
          }
        }
      },
      { status: 200 }
    );
  }),

  // Mock API for admin dashboard ----(15)
  http.get(API_ENDPOINTS.ADMIN_DASHBOARD, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        total_users: 6,
        active_users: 6,
        total_logins: 66,
        total_successful_logins: 64,
        total_failed_logins: 2,
        login_activity: [
          {
            id: 70,
            username: "admin",
            timestamp: "2026-01-03 09:40:41",
            ip_address: "172.18.0.1",
            user_agent: "PostmanRuntime/7.51.0",
            success: true
          },
          {
            id: 69,
            username: "admin",
            timestamp: "2026-01-03 09:39:35",
            ip_address: "172.18.0.1",
            user_agent: "PostmanRuntime/7.51.0",
            success: false
          }
        ],
        user_growth: {
          "2025-12": 6
        }
      },
      { status: 200 }
    );
  }),

  // Mock API for admin charts ----(16)
  http.get(API_ENDPOINTS.ADMIN_CHARTS, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check authentication
    if (!authHeader || !authHeader.startsWith("JWT ")) {
      return HttpResponse.json(
        { message: "Token is invalid or expired" },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        admin_charts: {
          user_growth: {
            labels: [],
            datasets: [
              {
                label: "New Users",
                data: [],
                borderColor: "#2196f3"
              }
            ]
          },
          login_activity: {
            labels: ["2025-12-19"],
            datasets: [
              {
                label: "Daily Logins",
                data: [6],
                borderColor: "#4caf50"
              }
            ]
          },
          success_ratio: {
            labels: ["Successful", "Failed"],
            datasets: [
              {
                data: [6, 1],
                backgroundColor: ["#4caf50", "#f44336"]
              }
            ]
          }
        }
      },
      { status: 200 }
    );
  }),

  // Mock API for email verification ----(17)
  http.post("/api/user/verify-email/:token", async ({ request, params }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const { token } = params;

    if (!token || token === "invalid-token") {
      return HttpResponse.json(
        { error: "Invalid verification token." },
        { status: 400 }
      );
    }

    if (token === "expired-token") {
      return HttpResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        message: "Email verified successfully. You can now log in.",
        languageReceived: acceptLanguage,
      },
      { status: 200 }
    );
  }),

  // Mock API for resend verification email ----(18)
  http.post("/api/user/resend-verification", async ({ request }) => {
    const acceptLanguage = request.headers.get("Accept-Language");
    const body = (await request.json()) as { email?: string };

    // Security: Always return success message even if email doesn't exist
    return HttpResponse.json(
      {
        message: "Verification email sent.",
        languageReceived: acceptLanguage,
      },
      { status: 200 }
    );
  }),
];
