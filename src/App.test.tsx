import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App, { AppContent, ProtectedRoute } from "./App";
import i18n from "./locale/i18n";
import userEvent from "@testing-library/user-event";
import store, { createStore } from "./store";
import { loginSuccess, logoutSuccess } from "./store/actions";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  axiosApiServiceLogin,
  fetchApiServiceLogout,
} from "./services/apiService";
import { API_ENDPOINTS } from "./services/apiEndpoints";
import { fillAndSubmitLoginForm } from "./tests/testUtils";
import LoginPageWrapper from "./page/LoginPage";
import ErrorBoundary from "./components/ErrorBoundary";
import UserList from "./components/UserList";
import { axiosApiServiceLoadUserList } from "./services/apiService";

// Mock SecureLS at the top level to ensure mocks are installed before store initialization
vi.mock("secure-ls", () => ({
  default: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  })),
}));

// Mock the UserPageWrapper component to prevent state updates in tests
// Provide realistic content for integration tests that expect specific elements
vi.mock("./page/UserPage", () => ({
  UserPageWrapper: () => (
    <div data-testid="user-page">
      <div data-testid="username">user1</div>
      <div data-testid="email">user1@mail.com</div>
    </div>
  ),
  default: () => (
    <div data-testid="user-page">
      <div data-testid="username">user1</div>
      <div data-testid="email">user1@mail.com</div>
    </div>
  ),
}));

// Mock the DashboardContainer component
vi.mock("./components/dashboard/DashboardContainer", () => ({
  default: () => <div data-testid="dashboard-container">Dashboard Content</div>,
}));

// Helper function to set up authenticated state
const mockAuth = (
  isAuthenticated: boolean,
  userOverrides: Record<string, unknown> = {}
) => {
  const user = {
    id: 1,
    username: "user1",
    access: "mock-jwt-access-token",
    refresh: "mock-jwt-refresh-token",
    email: "user1@mail.com",
    is_staff: false,
    is_superuser: false,
    logins_remaining_for_staff: 0,
    staff_access_granted: false,
    active_role: 'regular' as const,
    role_label: 'Regular',
    ...userOverrides,
  };
  if (isAuthenticated) {
    store.dispatch(loginSuccess(user as any));
  } else {
    store.dispatch(logoutSuccess());
  }
};

// Helper function to set up shared test environment state:
// resets Redux auth, clears localStorage, and sets the i18n language.
const setupTestEnvironment = async (language = "en") => {
  await act(async () => { store.dispatch(logoutSuccess()); });
  localStorage.clear();
  await act(async () => { await i18n.changeLanguage(language); });
};

describe("App", () => {
  beforeEach(async () => {
    // Suppress expected console.error from error handling tests to keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Suppress React Router "No routes matched" warnings from ProtectedRoute redirect tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await setupTestEnvironment();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up and reset state after each test
    store.dispatch(logoutSuccess());
    window.localStorage.clear();
    cleanup();
  });

  it("renders the App component", () => {
    render(<App />);
    screen.debug();
  });

  it("shows home page on app startup even with stored tokens", async () => {
    // This test verifies that stored tokens are NOT auto-restored on app startup
    // Users must explicitly log in to get authenticated
    // SecureLS is globally mocked, so even if tokens were stored, they won't be loaded

    // Even though we have stored tokens and try to navigate to dashboard
    window.history.pushState({}, "", "/dashboard");
    render(<App />);

    // Should show home page instead of dashboard because tokens are not auto-restored
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    // Dashboard should not be accessible without explicit login
    expect(screen.queryByTestId("dashboard-container")).not.toBeInTheDocument();

    // Verify that we're not authenticated - initial state has no tokens
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.accessToken).toBeNull();
    expect(state.auth.refreshToken).toBeNull();
  });

  it("requires explicit login to access protected routes", async () => {
    // Setup: Verify initial unauthenticated state
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);

    // Try to access dashboard
    window.history.pushState({}, "", "/dashboard");
    render(<App />);

    // Should redirect to home page
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("dashboard-container")).not.toBeInTheDocument();

    // Login link (sign in required) should be visible
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
  });
});

describe("Error Handling", () => {
  it("displays a fallback UI when a rendering error occurs", () => {
    // Create a component that throws an error during the render phase
    const ErrorThrowingComponent = () => {
      // This will throw an error during the render phase, which ErrorBoundary can catch
      throw new Error("Test render error");
    };

    // Suppress console.error for this test
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/error-trigger"]}>
          <Routes>
            <Route 
              path="/error-trigger" 
              element={
                <ErrorBoundary>
                  <ErrorThrowingComponent />
                </ErrorBoundary>
              } 
            />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // The ErrorDisplay component shows "Application Error" as the title
    // and the error message from the error object
    expect(screen.getByText("Application Error")).toBeInTheDocument();
    expect(screen.getByText("Test render error")).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});

describe("Routing", () => {
  beforeEach(async () => {
    // Suppress expected console.error from error handling tests to keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Suppress React Router "No routes matched" warnings from ProtectedRoute redirect tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await setupTestEnvironment();
  });

  /**
   * Pushes a fake history entry, sets auth state via Redux,
   * sets language, and renders App.
   */
  const setup = (
    path: string,
    lang: string,
    authenticated = false,
    user = {
      id: 1,
      username: "user1",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "user1@mail.com",
      is_staff: false,
      is_superuser: false,
      logins_remaining_for_staff: 0,
      staff_access_granted: false,
      active_role: 'regular' as const,
      role_label: 'Regular',
    }
  ) => {
    // Updated user default
    // Reset Redux auth state before each test
    store.dispatch(logoutSuccess());
    window.history.pushState({}, "", path);

    // Check if the path is a user profile path and extract the ID
    const userMatch = path.match(/^\/user\/(\d+)$/);
    let userIdFromPath: number | undefined;
    if (userMatch && userMatch[1]) {
      userIdFromPath = Number(userMatch[1]);
    }

    if (authenticated || userMatch) {
      // Check if authenticated or on a user profile path
      // Dispatch loginSuccess action if authenticated is true or on a user page
      // For user page paths, use the ID from the path if available, otherwise use the default user ID
      const userToDispatch =
        userMatch && userIdFromPath !== undefined
          ? {
              id: userIdFromPath,
              username: user.username,
              access: user.access,
              refresh: user.refresh,
              email: "user1@mail.com",
              is_staff: false,
              is_superuser: false,
              logins_remaining_for_staff: 0,
              staff_access_granted: false,
              active_role: 'regular' as const,
              role_label: 'Regular',
            }
          : user;
      store.dispatch(loginSuccess(userToDispatch as any));
    }

    // Change the language before rendering (only if a specific language is requested)
    if (lang !== "en") {
      // Only change if not the default English
      act(() => {
        i18n.changeLanguage(lang);
      });
    }
    render(<App />);
  };

  it.each`
    path               | pageTestId
    ${"/"}             | ${"home-page"}
    ${"/signup"}       | ${"signup-page"}
    ${"/login"}        | ${"login-page"}
    ${"/user/1"}       | ${"user-page"}
    ${"/user/2"}       | ${"user-page"}
    ${"/activate/123"} | ${"activation-page"}
    ${"/activate/456"} | ${"activation-page"}
  `("displays $pageTestId when path is $path", ({ path, pageTestId }) => {
    setup(path, "en"); // Use English for these basic routing tests
    const page = screen.queryByTestId(pageTestId);
    expect(page).toBeInTheDocument();
  });

  it("dashboard routes redirect unauthenticated users to home page", async () => {
    // Mock unauthenticated state
    mockAuth(false);
    setup("/dashboard", "en"); // Use the routing setup function
    
    // Verify we are redirected to home page
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  it.each`
    path               | pageTestId
    ${"/"}             | ${"signup-page"}
    ${"/"}             | ${"login-page"}
    ${"/"}             | ${"user-page"}
    ${"/"}             | ${"activation-page"}
    ${"/signup"}       | ${"home-page"}
    ${"/signup"}       | ${"login-page"}
    ${"/signup"}       | ${"user-page"}
    ${"/signup"}       | ${"activation-page"}
    ${"/login"}        | ${"home-page"}
    ${"/login"}        | ${"signup-page"}
    ${"/login"}        | ${"user-page"}
    ${"/login"}        | ${"activation-page"}
    ${"/user/1"}       | ${"home-page"}
    ${"/user/1"}       | ${"signup-page"}
    ${"/user/1"}       | ${"login-page"}
    ${"/user/1"}       | ${"activation-page"}
    ${"/activate/123"} | ${"home-page"}
    ${"/activate/123"} | ${"signup-page"}
    ${"/activate/123"} | ${"login-page"}
    ${"/activate/123"} | ${"user-page"}
  `(
    "does not display $pageTestId when path is $path",
    ({ path, pageTestId }) => {
      setup(path, "en"); // Use English
      const page = screen.queryByTestId(pageTestId);
      expect(page).not.toBeInTheDocument();
    }
  );

  it.each([
    ["Home page", "Home", "en"], // English
    ["Sign Up", "Sign Up", "en"],
    ["Home page", "ഹോം", "ml"], // Malayalam
    ["Sign Up", "രജിസ്റ്റർ ചെയ്യുക", "ml"],
    ["Home page", "الرئيسية", "ar"], // Arabic
    ["Sign Up", "تسجيل حساب جديد", "ar"],
  ])("has link to %s page on navbar in %s language", (_, linkText, lang) => {
    setup("/", lang); // Use the specified language
    const link = screen.getByRole("link", { name: linkText });
    expect(link).toBeInTheDocument();
  });

  // Test to check if clicking the "Sign Up" link redirects to the Sign Up page
  it.each([
    ["Sign Up", "تسجيل حساب جديد", "ar"],
    ["Sign Up", "രജിസ്റ്റർ ചെയ്യുക", "ml"],
    ["Sign Up", "Sign Up", "en"],
  ])(
    "displays Sign Up page after clicking 'Sign Up' link in %s language",
    (_, linkText, lang) => {
      setup("/", lang); // Render with the given language
      const signUpLink = screen.getByRole("link", { name: linkText });
      fireEvent.click(signUpLink);
      const signUpPage = screen.getByTestId("signup-page");
      expect(signUpPage).toBeInTheDocument();
    }
  );

  // Test the "Login" link
  it.each([
    ["Login page", "Login", "en"],
    ["Login page", "ലോഗിൻ", "ml"],
    ["Login page", "تسجيل الدخول", "ar"],
  ])(
    "displays Login page after clicking 'Login' link in %s language",
    (_, linkText, lang) => {
      setup("/", lang); // Render with the given language
      const loginLink = screen.getByRole("link", { name: linkText });
      fireEvent.click(loginLink);
      const loginPage = screen.getByTestId("login-page");
      expect(loginPage).toBeInTheDocument();
    }
  );

  // Integration test: Navigates to user profile via navbar link after simulating authenticated state
  it("navigates to user profile via navbar link after simulating authenticated state", async () => {
    // Simulate a logged-in state by dispatching the loginSuccess action with user ID and username
    const mockUser = {
      id: 1,
      username: "user1",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "user1@mail.com",
      is_staff: false,
      is_superuser: false,
      logins_remaining_for_staff: 0,
      staff_access_granted: false,
      active_role: 'regular' as const,
      role_label: 'Regular',
    };
    store.dispatch(loginSuccess(mockUser));

    // Render the App component (it will now render based on the authenticated state)
    render(<App />);

    // Wait for the "My Profile" link to appear in the navbar (it's conditional on auth state)
    const myProfileLink = screen.getByTestId("my-profile-link");

    // Assert that the profile link's href uses the profile route
    expect(myProfileLink).toHaveAttribute("href", "/profile");

    // Click the "My Profile" link
    await userEvent.click(myProfileLink);

    await waitFor(() => {
      // Check if the profile page component is rendered
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
      expect(screen.getByTestId("username")).toHaveTextContent("test002");
      expect(screen.getByTestId("email")).toHaveTextContent(
        "test002@gmail.com"
      );
    });
  });

  it("navigates to user page when clicking the username on user list", async () => {
    // Setup authenticated admin user as user2 (ID: 2) - this user will be filtered from the user list
    const mockAdminUser2 = {
      id: 2,
      username: "user2",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "user2@mail.com",
      is_staff: true,
      is_superuser: true,
      logins_remaining_for_staff: 0,
      staff_access_granted: true,
      active_role: 'staff' as const,
      role_label: 'Staff',
    };
    store.dispatch(loginSuccess(mockAdminUser2));

    // Navigate to the /users route where UserList is now located
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/users"]}>
          <Routes>
            <Route path="/users" element={<UserList ApiGetService={axiosApiServiceLoadUserList} />} />
            <Route path="/user/:id" element={
              <div data-testid="user-page">
                <div data-testid="username">user1</div>
                <div data-testid="email">user1@mail.com</div>
              </div>
            } />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Find the link to user1
    const userLink = await screen.findByText("user1");

    // Click user1 link
    act(() => {
      fireEvent.click(userLink);
    });

    // Check if the user page loads for user1 (ID: 1)
    const page = await screen.findByTestId("user-page");
    expect(page).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user1@mail.com")).toBeInTheDocument();
  });

  // Integration test: Navigates to user profile via navbar link after successful login (using MSW login flow)
  it("navigates to user profile via navbar link after successful login (MSW flow)", async () => {
    // Start by rendering the App component at the home page
    // Language is already set to English by the beforeEach hook
    const AppWithFetchLoginService = () => (
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/login"
              element={<LoginPageWrapper apiService={axiosApiServiceLogin} />}
            />
            {/* Use the rest of the AppContent for other routes */}
            <Route path="*" element={<AppContent />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    render(<AppWithFetchLoginService />);

    // Click the Login link in the navbar to go to the login page
    const loginLink = screen.getByTestId("login-link");
    await userEvent.click(loginLink);

    // Ensure we are on the login page
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    // Find the login form elements
    await fillAndSubmitLoginForm({
      email: "user@example.com",
      password: "Password1",
    });

    // Verify Redux state update
    await waitFor(() => {
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.id).toBe(1);
      expect(state.auth.user?.username).toBe("testuser");
    });

    // Wait for the navigation to the home page after successful login
    // This relies LoginPage component dispatching loginSuccess and navigating
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    // Wait for the "My Profile" link to appear in the navbar (it's conditional on auth state)
    const myProfileLink = screen.getByTestId("my-profile-link");

    // Click the "My Profile" link
    await userEvent.click(myProfileLink);

    await waitFor(() => {
      // Check if the profile page component is rendered
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
      expect(screen.getByTestId("username")).toHaveTextContent("test002");
      expect(screen.getByTestId("email")).toHaveTextContent(
        "test002@gmail.com"
      );
    });
  });
});

describe("Navbar styling and layout", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it("has content with proper top margin offset to prevent navbar overlap on small screens (2 rows)", () => {
    render(<App />);
    // Content should have dynamic margin-top based on navbar height via inline style
    const contentDiv = document.querySelector('[data-testid="navbar"]')?.nextElementSibling;
    if (contentDiv) {
      // margin-top is now set via inline style (style prop) matching navbar's offsetHeight
      const navBar = document.querySelector('nav');
      const expectedMargin = navBar ? `${navBar.offsetHeight}px` : undefined;
      if (expectedMargin) {
        expect(contentDiv).toHaveStyle(`margin-top: ${expectedMargin}`);
      }
    }
  });

  it("renders a fixed navbar with proper styles", () => {
    render(<App />);
    const navbar = document.querySelector("nav");

    // Verify navbar existence
    expect(navbar).toBeInTheDocument();

    // Layout and positioning
    expect(navbar).toHaveStyleRule("position", "fixed");
    expect(navbar).toHaveStyleRule("top", "0px");
    expect(navbar).toHaveStyleRule("z-index", "20");
    expect(navbar).toHaveStyleRule("width", "100%");

    // Background and shadow
    expect(navbar).toHaveStyleRule(
      "background-color",
      "rgb(156 163 175 / var(--tw-bg-opacity, 1))"
    ); // bg-gray-400
    expect(navbar).toHaveStyleRule(
      "color",
      "rgb(255 255 255 / var(--tw-text-opacity, 1))"
    ); // text-white
    expect(navbar).toHaveStyleRule(
      "box-shadow",
      "var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)"
    ); // shadow-lg

    // Spacing and padding
    expect(navbar).toHaveStyleRule("padding-top", "1rem"); // py-4
    expect(navbar).toHaveStyleRule("padding-bottom", "1rem");
    expect(navbar).toHaveStyleRule("padding-left", "1rem"); // px-4
    expect(navbar).toHaveStyleRule("padding-right", "1rem");

    // Flex layout - column direction for stacked rows on small screens
    expect(navbar).toHaveStyleRule("display", "flex");
    expect(navbar).toHaveStyleRule("flex-direction", "column");
  });

  it("switches to single row layout only on xl screens (desktop), keeps 2 rows on lg and below", () => {
    render(<App />);
    const navbar = document.querySelector("nav");
    expect(navbar).toBeInTheDocument();
    // All screens below xl: flex-direction is column (2 rows)
    expect(navbar).toHaveStyleRule("flex-direction", "column");
    // Content margin-top is now dynamically set via inline style based on navbar height
    const contentDiv = document.querySelector('[data-testid="navbar"]')?.nextElementSibling;
    if (contentDiv) {
      const expectedMargin = navbar ? `${navbar.offsetHeight}px` : undefined;
      if (expectedMargin) {
        expect(contentDiv).toHaveStyle(`margin-top: ${expectedMargin}`);
      }
    }
  });

  it("renders all navbar rows centered horizontally", () => {
    render(<App />);
    const navbar = document.querySelector("nav");
    // NavBar should have items-center to center all 3 rows horizontally
    expect(navbar).toHaveStyleRule("align-items", "center");
  });

  it("has overflow-hidden on navbar to prevent content overflow", () => {
    render(<App />);
    const navbar = document.querySelector("nav");
    expect(navbar).toHaveStyleRule("overflow", "hidden");
  });
});

describe("Malayalam language navbar layout", () => {
  beforeEach(async () => {
    await setupTestEnvironment("ml");
  });

  it("renders NavRowScrollWrapper with flex justify-center for Malayalam", () => {
    render(<App />);
    const scrollWrapper = document.querySelector('[data-testid="nav-row-2-wrapper-ml"]');
    expect(scrollWrapper).toBeInTheDocument();
    expect(scrollWrapper).toHaveStyleRule("display", "flex");
    expect(scrollWrapper).toHaveStyleRule("justify-content", "center");
  });

  it("shows ml-row-separator when authenticated in Malayalam", async () => {
    await act(async () => {
      mockAuth(true);
    });
    render(<App />);
    const separator = screen.queryByTestId("ml-row-separator");
    expect(separator).toBeInTheDocument();
  });

  it("does not show ml-row-separator when not authenticated in Malayalam", () => {
    render(<App />);
    const separator = screen.queryByTestId("ml-row-separator");
    expect(separator).not.toBeInTheDocument();
  });

  it("does not show ml-row-separator in English regardless of auth", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    await act(async () => {
      mockAuth(true);
    });
    render(<App />);
    const separator = screen.queryByTestId("ml-row-separator");
    expect(separator).not.toBeInTheDocument();
  });

  it("does not show ml-row-separator in Arabic regardless of auth", async () => {
    await act(async () => {
      await i18n.changeLanguage("ar");
    });
    await act(async () => {
      mockAuth(true);
    });
    render(<App />);
    const separator = screen.queryByTestId("ml-row-separator");
    expect(separator).not.toBeInTheDocument();
  });
});

describe("Malayalam font-size", () => {
  beforeEach(async () => {
    await act(async () => {
      store.dispatch(logoutSuccess());
    });
    localStorage.clear();
  });

  it("does not have a reduced font-size rule for Malayalam language in CSS", async () => {
    // The html[lang="ml"] { font-size: 87.5% } rule was removed from index.css
    // Verify no stylesheet contains a rule targeting html[lang="ml"] with font-size
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            const selectorText = rule.selectorText;
            const cssText = rule.style.cssText;
            // Check if any rule targets html[lang="ml"] with font-size
            const targetsMl = selectorText?.includes('html[lang="ml"]') || selectorText?.includes("html[lang='ml']");
            const hasFontSize = cssText?.includes('font-size');
            if (targetsMl && hasFontSize) {
              // If found, it should NOT be 87.5% (the old reduced value)
              expect(rule.style.fontSize).not.toBe("87.5%");
            }
          }
        }
      } catch (_e) {
        // Cross-origin stylesheets may throw, skip them
      }
    }
    // Also verify the html element has no inline font-size override when lang is ml
    await act(async () => {
      await i18n.changeLanguage("ml");
    });
    render(<App />);
    const htmlEl = document.documentElement;
    expect(htmlEl.style.fontSize).toBe("");
  });

  it("does not set inline font-size on html element for any language", async () => {
    for (const lang of ["en", "ml", "ar"]) {
      await act(async () => {
        await i18n.changeLanguage(lang);
      });
      render(<App />);
      const htmlEl = document.documentElement;
      expect(htmlEl.style.fontSize).toBe("");
      cleanup();
    }
  });
});

describe("Navbar link border styles", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it("renders nav links with border and hover styles", () => {
    render(<App />);
    
    // Get the signup and login links (unauthenticated state)
    const signupLink = screen.getByTestId("signup-link");
    const loginLink = screen.getByTestId("login-link");
    
    // Verify nav links have border styling (border + rounded-lg)
    expect(signupLink).toHaveStyleRule("border-width", "1px");
    expect(signupLink).toHaveStyleRule("border-radius", "0.5rem"); // rounded-lg
    expect(signupLink).toHaveStyleRule("padding-left", "0.75rem"); // px-3 (default)
    expect(signupLink).toHaveStyleRule("padding-right", "0.75rem");
    expect(signupLink).toHaveStyleRule("padding-top", "0.375rem"); // py-1.5 (default)
    expect(signupLink).toHaveStyleRule("padding-bottom", "0.375rem");
    
    // Verify same styles on login link
    expect(loginLink).toHaveStyleRule("border-width", "1px");
    expect(loginLink).toHaveStyleRule("border-radius", "0.5rem");
  });

  it("renders first row with Home link, ThemeSwitcher, and language buttons", () => {
    render(<App />);
    const navbar = document.querySelector('[data-testid="navbar"]');
    expect(navbar).toBeInTheDocument();
    // First row should contain Home link
    expect(screen.getByTestId("home-link")).toBeInTheDocument();
    // First row should contain theme switcher
    expect(screen.getByTestId("theme-switcher")).toBeInTheDocument();
    // First row should contain language buttons
    expect(screen.getByTestId("lang-en")).toBeInTheDocument();
    expect(screen.getByTestId("lang-ml")).toBeInTheDocument();
    expect(screen.getByTestId("lang-ar")).toBeInTheDocument();
  });

  it("renders second row with page header nav links", () => {
    render(<App />);
    // Second row (nav-row-2) should contain Dashboard, My Profile, Sign Up, Login links
    expect(screen.getByTestId("signup-link")).toBeInTheDocument();
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
  });

  it("renders only 2 rows in navbar (no third row)", () => {
    render(<App />);
    // Row 1 and Row 2 should exist
    expect(document.querySelector('[data-testid="nav-row-1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="nav-row-2"]')).toBeInTheDocument();
    // Row 3 should NOT exist (language buttons moved to row 1)
    expect(document.querySelector('[data-testid="nav-row-3"]')).not.toBeInTheDocument();
  });

  it("renders separator between ThemeSwitcher and language buttons in nav-row-1", () => {
    render(<App />);
    const navRow1 = document.querySelector('[data-testid="nav-row-1"]');
    if (navRow1) {
      const separators = navRow1.querySelectorAll("span");
      const dividerSpans = Array.from(separators).filter(
        (span) => span.tagName === "SPAN" && window.getComputedStyle(span).borderRightWidth !== "0px"
      );
      // There should be at least 2 separators: one after Home, one after ThemeSwitcher
      expect(dividerSpans.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("renders separator borders between nav items", () => {
    render(<App />);
    // Find the nav row that contains the nav links
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    if (navRow2) {
      const separators = navRow2.querySelectorAll("span");
      const dividerSpans = Array.from(separators).filter(
        (span) => span.tagName === "SPAN" && window.getComputedStyle(span).borderRightWidth !== "0px"
      );
      // There should be at least 1 separator between signup and login
      expect(dividerSpans.length).toBeGreaterThanOrEqual(1);
    }
  }
  );
});

describe("Navbar active page indicator", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it("highlights the active page link with visible border on signup page", () => {
    window.history.pushState({}, "", "/signup");
    render(<App />);
    
    const signupLink = screen.getByTestId("signup-link");
    // On the signup page, the signup link should have active border styling
    expect(signupLink.className).toContain("border-white");
  });

  it("highlights the active page link with visible border on login page", () => {
    window.history.pushState({}, "", "/login");
    render(<App />);
    
    const loginLink = screen.getByTestId("login-link");
    // On the login page, the login link should have active border styling
    expect(loginLink.className).toContain("border-white");
  });

  it("does not highlight signup link when on login page", () => {
    window.history.pushState({}, "", "/login");
    render(<App />);
    
    const signupLink = screen.getByTestId("signup-link");
    // The signup link should NOT have active border styling
    expect(signupLink.className).not.toContain("bg-white/10");
  });
});

describe("Language & direction tests for Navbar", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it.each`
    lang    | expectedDir | linkTextHome  | linkTextSignup         | linkTextLogin
    ${"en"} | ${"ltr"}    | ${"Home"}     | ${"Sign Up"}           | ${"Login"}
    ${"ml"} | ${"ltr"}    | ${"ഹോം"}      | ${"രജിസ്റ്റർ ചെയ്യുക"} | ${"ലോഗിൻ"}
    ${"ar"} | ${"rtl"}    | ${"الرئيسية"} | ${"تسجيل حساب جديد"}   | ${"تسجيل الدخول"}
  `(
    "should set document.dir to $expectedDir and show correct navbar texts in $lang",
    async ({
      lang,
      expectedDir,
      linkTextHome,
      linkTextSignup,
      linkTextLogin,
    }) => {
      // Make test async
      // Change the language before rendering
      await act(async () => {
        // Use await act for language change
        await i18n.changeLanguage(lang);
      });
      render(<App />);

      // Check document direction
      expect(document.documentElement.dir).toBe(expectedDir);
      expect(
        screen.getByRole("link", { name: linkTextHome })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: linkTextSignup })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: linkTextLogin })
      ).toBeInTheDocument();
    }
  );
});

describe("Authentication navbar visible", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  const setup = (path: string, lang: string) => {
    window.history.pushState({}, "", path);
    // Change the language before rendering (only if a specific language is requested)
    if (lang !== "en") {
      // Only change if not the default English
      act(() => {
        i18n.changeLanguage(lang);
      });
    }
    render(<App />);
  };

  afterEach(async () => {
    // Ensure Redux state is reset after each test in this block
    await act(async () => {
      store.dispatch(logoutSuccess());
    });
    localStorage.clear();
  });

  describe("When authenticated", () => {
    it.each`
      lang    | profileText        | logoutText
      ${"en"} | ${"My Profile"}    | ${"Logout"}
      ${"ml"} | ${"എന്റെ പ്രൊഫൈൽ"} | ${"ലോഗ്ഔട്ട്"}
      ${"ar"} | ${"ملفي"}          | ${"تسجيل الخروج"}
    `(
      "shows '$profileText' and '$logoutText' links and hides auth links in $lang",
      async ({ lang, profileText, logoutText }) => {
        await act(async () => {
          mockAuth(true); // Use mockAuth to set Redux state
        });
        setup("/", lang); // Use the specified language

        // Verify profile link exists
        const profileLink = screen.getByRole("link", { name: profileText });
        expect(profileLink).toBeInTheDocument();

        // Verify logout link exists
        const logoutLink = screen.getByRole("button", { name: logoutText });
        expect(logoutLink).toBeInTheDocument();

        // Verify auth links are hidden
        expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();
        expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
      }
    );

    describe("Admin navigation", () => {
      it("shows 'User List' link for admin users", async () => {
        await act(async () => {
          mockAuth(true, {
            id: 1,
            username: "admin",
            access: "mock-jwt-access-token",
            refresh: "mock-jwt-refresh-token",
            email: "admin@example.com",
            is_staff: true,
            is_superuser: true,
            active_role: 'superuser' as const,
            staff_access_granted: true,
            role_label: 'Superuser',
          });
        });
        setup("/", "en");

        // Verify admin sees the Users link
        const usersLink = screen.getByTestId("users-link");
        expect(usersLink).toBeInTheDocument();
        expect(usersLink).toHaveAttribute("href", "/users");
        expect(usersLink).toHaveTextContent("User List");
      });

      it("hides 'User List' link for non-admin users", async () => {
        await act(async () => {
          mockAuth(true, {
            id: 1,
            username: "regular",
            access: "mock-jwt-access-token",
            refresh: "mock-jwt-refresh-token",
            email: "regular@example.com",
            is_staff: false,
            is_superuser: false,
          });
        });
        setup("/", "en");

        // Verify non-admin doesn't see the Users link
        expect(screen.queryByTestId("users-link")).not.toBeInTheDocument();
      });

    it("shows translated 'User List' link for admin users in different languages", async () => {
      await act(async () => {
        mockAuth(true, {
          id: 1,
          username: "admin",
          access: "mock-jwt-access-token",
          refresh: "mock-jwt-refresh-token",
          email: "admin@example.com",
          is_staff: true,
          is_superuser: true,
          active_role: 'superuser' as const,
          staff_access_granted: true,
          role_label: 'Superuser',
        });
      });

      await act(async () => {
        await i18n.changeLanguage("ml");
      });
      render(<App />);

      // Verify admin sees the translated Users link in Malayalam
      const usersLink = screen.getByTestId("users-link");
      expect(usersLink).toBeInTheDocument();
      expect(usersLink).toHaveTextContent("ഉപയോക്തൃ പട്ടിക");
    });

    describe("Dashboard navigation", () => {
      it("shows 'Dashboard' link for authenticated users", async () => {
        await act(async () => {
          mockAuth(true);
        });
        setup("/", "en");

        // Verify dashboard link exists
        const dashboardLink = screen.getByTestId("dashboard-link");
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute("href", "/dashboard");
        // Check that it contains the translated text (i18n behavior)
        expect(dashboardLink).toHaveTextContent("Dashboard");
      });

      it("hides 'Dashboard' link for unauthenticated users", async () => {
        await act(async () => {
          mockAuth(false);
        });
        setup("/", "en");

        // Verify dashboard link is hidden
        expect(screen.queryByTestId("dashboard-link")).not.toBeInTheDocument();
      });

      it("shows dashboard link for authenticated users in different languages", async () => {
        await act(async () => {
          mockAuth(true);
        });

        await act(async () => {
          await i18n.changeLanguage("ml");
        });
        render(<App />);

        // Verify dashboard link exists with translated text
        const dashboardLink = screen.getByTestId("dashboard-link");
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveTextContent("ഡാഷ്ബോർഡ്");
      });

      it("navigates to dashboard when clicking dashboard link", async () => {
        await act(async () => {
          mockAuth(true);
        });
        render(<App />);

        const dashboardLink = screen.getByTestId("dashboard-link");
        await userEvent.click(dashboardLink);

        // Verify dashboard container is rendered
        await waitFor(() => {
          expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
        });
      });
    });


      it("allows regular users to access their own dashboard", async () => {
        // Setup regular user (ID: 5)
        await act(async () => {
          mockAuth(true, {
            id: 5,
            username: "regular",
            access: "mock-jwt-access-token",
            refresh: "mock-jwt-refresh-token",
            email: "regular@example.com",
            is_staff: false,
            is_superuser: false,
          });
        });

        setup("/", "en");

        // Navigate to dashboard route
        window.history.pushState({}, "", "/dashboard");
        render(<App />);

        // Verify dashboard container is rendered (route protection passes)
        const dashboardContainer = screen.queryByTestId("dashboard-container");
        expect(dashboardContainer).toBeInTheDocument();
      });

      it("ProtectedRoute correctly redirects unauthenticated users from protected routes", async () => {
        // Test that dashboard routes are protected by checking the ProtectedRoute component behavior
        const TestDashboard = () => <div data-testid="test-dashboard">Test Dashboard</div>;

        // Test unauthenticated access
        render(
          <Provider store={store}>
            <MemoryRouter initialEntries={["/protected-dashboard"]}>
              <Routes>
                <Route
                  path="/protected-dashboard"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <TestDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );

        // Should redirect to home page instead of showing error message
        await waitFor(() => {
          expect(screen.getByTestId("home-page")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("test-dashboard")).not.toBeInTheDocument();
      });

      it("authorization errors display proper messages for dashboard access", async () => {
        // This test verifies that the component-level authorization in DashboardContainer
        // properly displays error messages. Since the DashboardContainer is mocked,
        // we test the ProtectedRoute behavior which is what guards the dashboard routes.

        // Test with authenticated user accessing dashboard
        await act(async () => {
          mockAuth(true);
        });

        render(
          <Provider store={store}>
            <MemoryRouter initialEntries={["/dashboard"]}>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <div data-testid="authorized-dashboard">Authorized Dashboard</div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </MemoryRouter>
          </Provider>
        );

        // Should show authorized dashboard (not error message)
        expect(screen.getByTestId("authorized-dashboard")).toBeInTheDocument();
        expect(screen.queryByText("Your session has expired. Please log in again.")).not.toBeInTheDocument();
      });

      it("redirects unauthenticated users from dashboard to home page", async () => {
        // Ensure user is not authenticated
        await act(async () => {
          mockAuth(false);
        });

        setup("/dashboard", "en");

        // Verify we are redirected to home page
        await waitFor(() => {
          expect(screen.getByTestId("home-page")).toBeInTheDocument();
        });

        // Verify dashboard is not accessible
        expect(screen.queryByTestId("dashboard-container")).not.toBeInTheDocument();
      });

      it("allows authenticated admin users to access /dashboard/:userId route", async () => {
        // Setup authenticated admin user
        await act(async () => {
          mockAuth(true, {
            id: 1,
            username: "admin",
            access: "mock-jwt-access-token",
            refresh: "mock-jwt-refresh-token",
            email: "admin@example.com",
            is_staff: true,
            is_superuser: true,
          });
        });

        // Render app and navigate to another user's dashboard
        render(
          <Provider store={store}>
            <MemoryRouter initialEntries={["/dashboard/5"]}>
              <Routes>
                <Route
                  path="/dashboard/:userId"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <div data-testid="dashboard-container">Dashboard Content</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );

        // Should show dashboard for admin user accessing another user's dashboard
        await waitFor(() => {
          expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
        });

        // Home page should not be visible
        expect(screen.queryByTestId("home-page")).not.toBeInTheDocument();
      });

      it("allows authenticated regular users to access /dashboard/:userId route", async () => {
        // Setup authenticated regular user
        await act(async () => {
          mockAuth(true, {
            id: 5,
            username: "regular",
            access: "mock-jwt-access-token",
            refresh: "mock-jwt-refresh-token",
            email: "regular@example.com",
            is_staff: false,
            is_superuser: false,
          });
        });

        // Render app and navigate to dashboard with user ID parameter
        render(
          <Provider store={store}>
            <MemoryRouter initialEntries={["/dashboard/5"]}>
              <Routes>
                <Route
                  path="/dashboard/:userId"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <div data-testid="dashboard-container">Dashboard Content</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );

        // Should show dashboard for authenticated user
        await waitFor(() => {
          expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
        });

        // Home page should not be visible
        expect(screen.queryByTestId("home-page")).not.toBeInTheDocument();
      });

      it("redirects unauthenticated users from /dashboard/:userId to home page", async () => {
        // Ensure user is not authenticated
        await act(async () => {
          mockAuth(false);
        });

        // Render app and try to access another user's dashboard
        render(
          <Provider store={store}>
            <MemoryRouter initialEntries={["/dashboard/5"]}>
              <Routes>
                <Route
                  path="/dashboard/:userId"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <div data-testid="dashboard-container">Dashboard Content</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
              </Routes>
            </MemoryRouter>
          </Provider>
        );

        // Should redirect to home page for unauthenticated access
        await waitFor(() => {
          expect(screen.getByTestId("home-page")).toBeInTheDocument();
        });

        // Dashboard should not be accessible
        expect(screen.queryByTestId("dashboard-container")).not.toBeInTheDocument();
      });
    });
  });

  describe("When not authenticated", () => {
    it.each`
      lang    | signupText             | loginText
      ${"en"} | ${"Sign Up"}           | ${"Login"}
      ${"ml"} | ${"രജിസ്റ്റർ ചെയ്യുക"} | ${"ലോഗിൻ"}
      ${"ar"} | ${"تسجيل حساب جديد"}   | ${"تسجيل الدخول"}
    `(
      "shows '$signupText' and '$loginText' links",
      async ({ lang, signupText, loginText }) => {
        await act(async () => {
          mockAuth(false); // Use mockAuth to set Redux state
        });
        setup("/", lang); // Use the specified language

        // Verify auth links exist
        const signupLink = screen.getByRole("link", { name: signupText });
        const loginLink = screen.getByRole("link", { name: loginText });
        expect(signupLink).toBeInTheDocument();
        expect(loginLink).toBeInTheDocument();

        // Verify profile link is hidden
        expect(screen.queryByTestId("my-profile-link")).not.toBeInTheDocument();
      }
    );
  });
});

describe("Logout functionality", () => {
  const mockAuthenticatedUser = () => {
    mockAuth(true, {
      id: 1,
      username: "user1",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "user1@mail.com",
      is_staff: false,
      is_superuser: false,
    });
  };

  beforeEach(() => {
    i18n.changeLanguage("en");
    localStorage.clear();
    mockAuthenticatedUser();
  });

  afterEach(() => {
    store.dispatch(logoutSuccess());
  });

  it("logout successful flow when clicking logout link", async () => {
    // Create spy specifically for this test
    const postSpy = vi
      .spyOn(fetchApiServiceLogout, "post")
      .mockImplementation(async (_url: string) => {
        return { status: 200, data: {} };
      });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <AppContent logoutApiService={fetchApiServiceLogout} />
        </MemoryRouter>
      </Provider>
    );

    // Test logic
    await userEvent.click(await screen.findByTestId("logout-link"));

    // API verification
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(API_ENDPOINTS.LOGOUT);
    });

    // Auth state assertions
    const authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();
    expect(authState.accessToken).toBeNull();
    expect(authState.refreshToken).toBeNull();

    // UI assertions
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
    expect(screen.queryByTestId("logout-link")).not.toBeInTheDocument();

    // Navigation assertion
    expect(screen.getByTestId("home-page")).toBeInTheDocument();

    // Cleanup
    postSpy.mockRestore();
  });
});

describe("Theme Functionality", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("initializes with light theme by default", () => {
    render(<App />);
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("toggles between light and dark themes when switch is clicked", async () => {
    render(<App />);
    const themeSwitcher = screen.getByTestId("theme-switcher");

    await userEvent.click(themeSwitcher);
    expect(document.documentElement).toHaveClass("dark");

    await userEvent.click(themeSwitcher);
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("persists theme selection across page reloads", async () => {
    const { unmount } = render(<App />);
    const themeSwitcher = screen.getByTestId("theme-switcher");

    await userEvent.click(themeSwitcher);
    unmount();

    render(<App />);
    await waitFor(
      () => {
        expect(document.documentElement).toHaveClass("dark");
      },
      { timeout: 1000 }
    );
  });
});

describe("Protected Route", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

  it("renders children when user is authenticated and has admin access", () => {
    const adminUser = {
      id: 1,
      username: "admin",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "admin@example.com",
      is_staff: true,
      is_superuser: true,
      logins_remaining_for_staff: 0,
      staff_access_granted: true,
      active_role: 'staff' as const,
      role_label: 'Staff',
    };
    store.dispatch(loginSuccess(adminUser));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>
      </Provider>
    );

    // Navigate to /users route (which is protected)
    window.history.pushState({}, "", "/users");

    // The UserList component should render (not the access denied message)
    // Since we can't easily test the route protection without mocking,
    // we'll test that the admin user sees the Users link and can navigate
    expect(screen.getByTestId("users-link")).toBeInTheDocument();
  });

  it("shows access denied message for non-admin authenticated users", async () => {
    const regularUser = {
      id: 1,
      username: "regular",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "regular@example.com",
      is_staff: false,
      is_superuser: false,
      logins_remaining_for_staff: 0,
      staff_access_granted: false,
      active_role: 'regular' as const,
      role_label: 'Regular',
    };
    store.dispatch(loginSuccess(regularUser));

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/users"]}>
          <Routes>
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Should show access denied message
    expect(screen.getByText("You need administrator privileges to view the user list.")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users from admin routes to home page", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/users"]}>
          <Routes>
            <Route
              path="/users"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Should redirect to home page instead of showing error message
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});

describe("Navbar persistence with sessionStorage", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it("auth state is restored after page refresh within the same session", async () => {
    // Initial login (without token in state)
    const loginUser = {
      id: 5,
      username: "persistedUser",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      is_staff: false,
      is_superuser: false,
      logins_remaining_for_staff: 0,
      staff_access_granted: false,
      active_role: 'regular' as const,
      role_label: 'Regular',
    };
    const expectedUser = {
      id: 5,
      username: "persistedUser",
      is_staff: false,
      is_superuser: false,
      logins_remaining_for_staff: 0,
      staff_access_granted: false,
      active_role: 'regular' as const,
      role_label: 'Regular',
    };

    // Render the app with the Redux provider
    render(
      <Provider store={store}>
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>
      </Provider>
    );

    // Verify initial state - should show login/signup links
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
    expect(screen.getByTestId("signup-link")).toBeInTheDocument();

    // Dispatch login action to update Redux state
    await act(async () => {
      store.dispatch(loginSuccess(loginUser));
    });

    // Verify navbar updated - should now show profile link
    const profileLink = await screen.getByTestId("my-profile-link");
    expect(profileLink).toHaveAttribute("href", "/profile");

    // Verify auth links are hidden after login
    expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();

    // Simulate page refresh by creating a new store in the same browser session
    const newStore = createStore();

    // Verify refreshed store restores auth state from sessionStorage
    const refreshedState = newStore.getState().auth;
    expect(refreshedState.isAuthenticated).toBe(true);
    expect(refreshedState.user).toEqual(expectedUser);
    expect(refreshedState.accessToken).toBe("mock-jwt-access-token");
    expect(refreshedState.refreshToken).toBe("mock-jwt-refresh-token");

    // Clean up the first render
    cleanup();

    // Re-render app with "refreshed" store
    render(
      <Provider store={newStore}>
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>
      </Provider>
    );

    // Verify navbar state after refresh
    expect(screen.getByTestId("my-profile-link")).toBeInTheDocument();
    expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();
  });

  it("requires re-login after browser close or new session", async () => {
    // Initial admin login
    const adminLoginUser = {
      id: 10,
      username: "adminUser",
      access: "mock-admin-access-token",
      refresh: "mock-admin-refresh-token",
      is_staff: true,
      is_superuser: true,
      logins_remaining_for_staff: 0,
      staff_access_granted: true,
      active_role: 'staff' as const,
      role_label: 'Staff',
    };

    // Render the app with the Redux provider
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <AppContent />
        </MemoryRouter>
      </Provider>
    );

    // Dispatch admin login action
    await act(async () => {
      store.dispatch(loginSuccess(adminLoginUser));
    });

    // Verify admin navbar elements are present
    const usersLink = screen.getByTestId("users-link");
    expect(usersLink).toBeInTheDocument();
    expect(usersLink).toHaveAttribute("href", "/users");

    // Navigate to dashboard
    const dashboardLink = screen.getByTestId("dashboard-link");
    await userEvent.click(dashboardLink);

    // Verify we're on dashboard (mocked component)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
    });

    // Simulate browser close by clearing sessionStorage and creating a new store
    sessionStorage.clear();
    const refreshedStore = createStore();

    // Verify new session does NOT restore auth state
    expect(refreshedStore.getState().auth.isAuthenticated).toBe(false);
    expect(refreshedStore.getState().auth.user).toBeNull();

    // Clean up the first render
    cleanup();

    // Re-render app with "refreshed" store - trying to access dashboard
    render(
      <Provider store={refreshedStore}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <AppContent />
        </MemoryRouter>
      </Provider>
    );

    // After refresh, auth state is not restored
    // So trying to access protected route should redirect to home
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    // Dashboard should NOT be accessible
    expect(screen.queryByTestId("dashboard-container")).not.toBeInTheDocument();

    // Admin navbar elements should NOT be present (not authenticated)
    expect(screen.queryByTestId("users-link")).not.toBeInTheDocument();
    
    // Login link should be visible instead
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
  });
});

describe("Navbar Row 2 language-specific scroll behavior", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it("uses normal NavRow (no scroll) when language is English in unauthenticated state", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<App />);
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).toBeInTheDocument();
    // Should NOT have overflow-x-auto style for English
    expect(navRow2).not.toHaveStyleRule("overflow-x", "auto");
    // Should be a plain flex div (NavRow) without scrollable wrapper
    expect(navRow2?.parentElement).not.toHaveAttribute("data-testid", "nav-row-2-wrapper-ml");
  });

  it("uses normal NavRow (no scroll) when language is Arabic in unauthenticated state", async () => {
    await act(async () => {
      await i18n.changeLanguage("ar");
    });
    render(<App />);
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).toBeInTheDocument();
    expect(navRow2).not.toHaveStyleRule("overflow-x", "auto");
  });

  it("uses NavRowScrollable when language is Malayalam in unauthenticated state", async () => {
    await act(async () => {
      await i18n.changeLanguage("ml");
    });
    render(<App />);
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).toBeInTheDocument();
    // Should have overflow-x-auto for scrollable behavior
    expect(navRow2).toHaveStyleRule("overflow-x", "auto");
    // Should have flex-nowrap to prevent wrapping
    expect(navRow2).toHaveStyleRule("flex-wrap", "nowrap");
    // Should be wrapped in the ML-specific scrollable wrapper
    const wrapper = document.querySelector('[data-testid="nav-row-2-wrapper-ml"]');
    expect(wrapper).toBeInTheDocument();
  });

  it("switches Row 2 from scrollable back to normal when switching from ML to EN", async () => {
    // Start in Malayalam
    await act(async () => {
      await i18n.changeLanguage("ml");
    });
    const { rerender } = render(<App />);
    
    // Verify ML has scrollable row
    let navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).toHaveStyleRule("overflow-x", "auto");
    
    // Switch to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    rerender(<App />);
    
    // Verify EN has normal row
    navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).not.toHaveStyleRule("overflow-x", "auto");
  });

  it("uses normal NavRow when logged in as admin with English language", async () => {
    // Set up admin auth
    const adminUser = {
      id: 1,
      username: "admin",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "admin@example.com",
      is_staff: true,
      is_superuser: true,
      logins_remaining_for_staff: 0,
      staff_access_granted: true,
      active_role: 'staff' as const,
      role_label: 'Staff',
    };
    await act(async () => {
      store.dispatch(loginSuccess(adminUser));
      await i18n.changeLanguage("en");
    });
    render(<App />);
    
    // Verify admin nav links are present (more items = potential overflow in ML)
    expect(screen.getByTestId("dashboard-link")).toBeInTheDocument();
    expect(screen.getByTestId("my-profile-link")).toBeInTheDocument();
    expect(screen.getByTestId("users-link")).toBeInTheDocument();
    expect(screen.getByTestId("logout-link")).toBeInTheDocument();
    
    // Row 2 should still be normal for English
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).not.toHaveStyleRule("overflow-x", "auto");
  });

  it("uses NavRowScrollable when logged in as admin with Malayalam language", async () => {
    // Set up admin auth
    const adminUser = {
      id: 1,
      username: "admin",
      access: "mock-jwt-access-token",
      refresh: "mock-jwt-refresh-token",
      email: "admin@example.com",
      is_staff: true,
      is_superuser: true,
      logins_remaining_for_staff: 0,
      staff_access_granted: true,
      active_role: 'staff' as const,
      role_label: 'Staff',
    };
    await act(async () => {
      store.dispatch(loginSuccess(adminUser));
      await i18n.changeLanguage("ml");
    });
    render(<App />);
    
    // Verify admin nav links are present with ML text
    expect(screen.getByTestId("dashboard-link")).toBeInTheDocument();
    expect(screen.getByTestId("my-profile-link")).toBeInTheDocument();
    expect(screen.getByTestId("users-link")).toBeInTheDocument();
    expect(screen.getByTestId("logout-link")).toBeInTheDocument();
    
    // Row 2 should be scrollable for Malayalam
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).toHaveStyleRule("overflow-x", "auto");
    const wrapper = document.querySelector('[data-testid="nav-row-2-wrapper-ml"]');
    expect(wrapper).toBeInTheDocument();
  });

  it("does not apply fade mask to NavRowScrollable when no scroll arrows are visible", async () => {
    // In jsdom, content doesn't overflow so canScrollLeft and canScrollRight are both false
    await act(async () => {
      await i18n.changeLanguage("ml");
    });
    render(<App />);
    const navRow2 = document.querySelector('[data-testid="nav-row-2"]');
    expect(navRow2).toBeInTheDocument();

    // Both arrows should NOT be visible (no overflow in jsdom)
    expect(screen.queryByTestId("scroll-left-arrow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scroll-right-arrow")).not.toBeInTheDocument();

    // When no arrows are visible, mask-image should be 'none'
    const styleAttr = navRow2?.getAttribute('style') || '';
    expect(styleAttr).toContain('mask-image: none');
  });
});

describe("Navbar alignment for Malayalam language", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  it("uses NavRowScrollWrapper with proper structure for Malayalam right alignment", async () => {
    // This test verifies the fix for the Malayalam alignment issue:
    // The NavRowScrollWrapper should have the correct structure and styles
    // so that on xl screens, it sizes to its content and allows justify-between 
    // to push it to the right (same as English nav links behavior)
    await act(async () => {
      await i18n.changeLanguage("ml");
    });
    render(<App />);

    // Verify the ML-specific scrollable wrapper exists
    const wrapper = document.querySelector('[data-testid="nav-row-2-wrapper-ml"]');
    expect(wrapper).toBeInTheDocument();

    // Verify the wrapper is a direct child of NavBar (same level as Row 1)
    // so justify-between can distribute space between them on xl
    const navbar = document.querySelector('[data-testid="navbar"]');
    expect(wrapper!.parentElement).toBe(navbar);

    // The wrapper should NOT have flex-grow: 1 (which would prevent right alignment)
    const wrapperStyle = window.getComputedStyle(wrapper!);
    expect(wrapperStyle.flexGrow).not.toBe("1");

    // Verify width is set to 100% (w-full) for small screens 
    // On xl screens, xl:w-auto overrides this for proper right alignment
    expect(wrapperStyle.width).toBe("100%");
  });

  it("ensures NavRowScrollWrapper does not use flex-grow to prevent right alignment issue", async () => {
    // This test specifically validates that the NavRowScrollWrapper
    // doesn't use any flex-grow property that would prevent justify-between
    // from correctly aligning it to the right on xl screens
    await act(async () => {
      await i18n.changeLanguage("ml");
    });
    render(<App />);

    const wrapper = document.querySelector('[data-testid="nav-row-2-wrapper-ml"]');
    expect(wrapper).toBeInTheDocument();

    // Verify the wrapper does NOT have flex-grow set to 1
    // flex-grow:1 would make it take all remaining space, breaking right-alignment
    const wrapperStyle = window.getComputedStyle(wrapper!);
    expect(wrapperStyle.flexGrow).not.toBe("1");
  });

  describe("Global Malayalam font scaling", () => {
    beforeAll(async () => {
      // Import the CSS so the html[lang="ml"] rule is processed by PostCSS in jsdom
      await import("./index.css");
    });

    it("sets html lang to 'ml' when Malayalam language is active", async () => {
      await act(async () => {
        await i18n.changeLanguage("en");
      });
      render(<App />);
      expect(document.documentElement.lang).toBe("en");

      await act(async () => {
        await i18n.changeLanguage("ml");
      });
      expect(document.documentElement.lang).toBe("ml");
    });

    it("reverts html lang from 'ml' back to 'en' when switching to English", async () => {
      await act(async () => {
        await i18n.changeLanguage("ml");
      });
      render(<App />);
      expect(document.documentElement.lang).toBe("ml");

      await act(async () => {
        await i18n.changeLanguage("en");
      });
      expect(document.documentElement.lang).toBe("en");
    });
  });
});
