import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import App, { AppContent } from "./App";
import i18n from "./locale/i18n";
import userEvent from "@testing-library/user-event";
import store, { createStore } from "./store";
import { loginSuccess, logout } from "./store/authSlice";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fetchApiServiceLogin } from "./services/apiService";
import { fillAndSubmitLoginForm } from "./tests/testUtils";
import LoginPageWrapper from "./page/LoginPage";

describe("App", () => {
  it("renders the App component", () => {
    render(<App />);

    screen.debug();
  });
});

describe("Routing", () => {
  beforeEach(async () => {
    // Make beforeEach async
    // Reset Redux auth state before each test
    store.dispatch(logout());
    // Clear localStorage as a precaution
    window.localStorage.clear();
    // Set default language to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  /**
   * Pushes a fake history entry, sets auth state via Redux,
   * sets language, and renders App.
   */
  const setup = (
    path: string,
    lang: string,
    authenticated = false,
    user = { id: 1, username: "user1" }
  ) => {
    // Updated user default
    // Reset Redux auth state before each test
    store.dispatch(logout());

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
          ? { id: userIdFromPath, username: user.username }
          : user;
      store.dispatch(loginSuccess(userToDispatch));
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
    const mockUser = { id: 1, username: "user1" };
    store.dispatch(loginSuccess(mockUser));

    // Render the App component (it will now render based on the authenticated state)
    render(<App />);

    // Wait for the "My Profile" link to appear in the navbar (it's conditional on auth state)
    const myProfileLink = await screen.findByTestId("my-profile-link");

    // Assert that the profile link's href uses the user ID
    expect(myProfileLink).toHaveAttribute("href", `/user/${mockUser.id}`);

    // Click the "My Profile" link
    await userEvent.click(myProfileLink);

    await waitFor(() => {
      expect(screen.getByTestId("user-page")).toBeInTheDocument();
      expect(screen.getByTestId("username")).toHaveTextContent("user1");
      expect(screen.getByTestId("email")).toHaveTextContent("user1@mail.com");
    });
  });

  it("navigates to user page when clicking the username on user list", async () => {
    store.dispatch(loginSuccess({ id: 2, username: "user2" }));
    setup("/", "en", true, { id: 2, username: "user2" }); // Setup with authenticated state and user object

    const userLink = await screen.findByText("user2");
    userEvent.click(userLink);

    // Check if the user page loads
    // The route is now /user/:id, so the user page should load for user ID 2
    const page = await screen.findByTestId("user-page");
    expect(page).toBeInTheDocument();
    expect(screen.getByTestId("username")).toHaveTextContent("user2");
    expect(screen.getByTestId("email")).toHaveTextContent("user2@mail.com");
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
              element={<LoginPageWrapper apiService={fetchApiServiceLogin} />}
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
      expect(state.auth.user?.username).toBe("user@example.com");
    });

    // Wait for the navigation to the home page after successful login
    // This relies LoginPage component dispatching loginSuccess and navigating
    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    // Wait for the "My Profile" link to appear in the navbar (it's conditional on auth state)
    const myProfileLink = await screen.findByTestId("my-profile-link");

    // Click the "My Profile" link
    await userEvent.click(myProfileLink);

    await waitFor(() => {
      // Check if the user page component is rendered
      expect(screen.getByTestId("user-page")).toBeInTheDocument();
      expect(screen.getByTestId("username")).toHaveTextContent("user1");
      expect(screen.getByTestId("email")).toHaveTextContent("user1@mail.com");
    });
  });
});

describe("Navbar styling and layout", () => {
  beforeEach(async () => {
    // Reset Redux auth state before each test in this describe block
    store.dispatch(logout());
    // Clear localStorage as a precaution
    window.localStorage.clear();
    // Set default language to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
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
    expect(navbar).toHaveStyleRule("padding-left", "1.5rem"); // px-6
    expect(navbar).toHaveStyleRule("padding-right", "1.5rem");

    // Flex layout
    expect(navbar).toHaveStyleRule("display", "flex");
    expect(navbar).toHaveStyleRule("align-items", "center");
    expect(navbar).toHaveStyleRule("justify-content", "space-between");
  });
});

describe("Language & direction tests for Navbar", () => {
  beforeEach(async () => {
    // Make beforeEach async
    // Reset Redux auth state before each test in this describe block
    store.dispatch(logout());
    // Clear localStorage as a precaution, though Redux is now primary
    window.localStorage.clear();
    // Set default language to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
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
  // Set default language to English for all tests in this describe block
  beforeEach(async () => {
    // Make beforeEach async
    // Reset Redux auth state before each test in this describe block
    store.dispatch(logout());
    // Clear localStorage as a precaution
    localStorage.clear();
    // Set default language to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
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

  // Modified mockAuth to dispatch Redux actions
  const mockAuth = (
    authenticated: boolean,
    user = { id: 1, username: "user1" }
  ) => {
    if (authenticated) {
      store.dispatch(loginSuccess(user));
    } else {
      store.dispatch(logout());
    }
  };

  afterEach(() => {
    // Ensure Redux state is reset after each test in this block
    store.dispatch(logout());
    localStorage.clear();
  });

  describe("When authenticated", () => {
    it.each`
      lang    | profileText
      ${"en"} | ${"My Profile"}
      ${"ml"} | ${"എന്റെ പ്രൊഫൈൽ"}
      ${"ar"} | ${"ملفي"}
    `(
      "shows '$profileText' link and hides auth links in $lang",
      ({ lang, profileText }) => {
        mockAuth(true); // Use mockAuth to set Redux state
        setup("/", lang); // Use the specified language

        // Verify profile link exists
        const profileLink = screen.getByRole("link", { name: profileText });
        expect(profileLink).toBeInTheDocument();

        // Verify auth links are hidden
        expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();
        expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
      }
    );
  });

  describe("When not authenticated", () => {
    it.each`
      lang    | signupText             | loginText
      ${"en"} | ${"Sign Up"}           | ${"Login"}
      ${"ml"} | ${"രജിസ്റ്റർ ചെയ്യുക"} | ${"ലോഗിൻ"}
      ${"ar"} | ${"تسجيل حساب جديد"}   | ${"تسجيل الدخول"}
    `(
      "shows '$signupText' and '$loginText' links",
      ({ lang, signupText, loginText }) => {
        mockAuth(false); // Use mockAuth to set Redux state
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

  describe("Logout functionality", () => {
    it("should show logout link when authenticated and clear auth state on click", async () => {
      // Set up authenticated state
      mockAuth(true, { id: 1, username: "user1" });
      setup("/", "en");
      
      // Verify logout link is visible
      const logoutLink = screen.getByTestId("logout-link");
      expect(logoutLink).toBeInTheDocument();
      
      // Click logout link
      await userEvent.click(logoutLink);
      
      // Verify auth state is cleared
      await waitFor(() => {
        const state = store.getState();
        expect(state.auth.isAuthenticated).toBe(false);
        expect(state.auth.user).toBeNull();
      });
      
      // Verify auth links are now visible
      await waitFor(() => {
        expect(screen.getByTestId("signup-link")).toBeInTheDocument();
        expect(screen.getByTestId("login-link")).toBeInTheDocument();
      });
      
      // Verify profile link is hidden
      expect(screen.queryByTestId("my-profile-link")).not.toBeInTheDocument();
    });
  });
});

// Update the test for Redux store persistence
describe("Redux store persistence", () => {
  beforeEach(() => {
    // Clear any existing state
    store.dispatch(logout());
    localStorage.clear();
    
    // Reset mocks
    vi.resetModules();
    vi.clearAllMocks();
  });
  
  it("loads auth state from localStorage on store creation", () => {
    // Mock SecureLS to return a specific value
    vi.mock('secure-ls', () => {
      return {
        default: vi.fn().mockImplementation(() => ({
          set: vi.fn(),
          get: vi.fn().mockReturnValue({
            isAuthenticated: true,
            user: { id: 5, username: "persistedUser" }
          }),
          remove: vi.fn(),
        })),
      };
    });
    
    // Create a new store, which should load from SecureLS
    const newStore = createStore();

    // Check if the auth state was loaded correctly
    const loadedAuthState = newStore.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(true);
    expect(loadedAuthState.user).toEqual({ id: 5, username: "persistedUser" });
    // No assertion for token since it's not stored
  });
});

describe("Navbar persistence with localStorage", () => {
  beforeEach(async () => {
    // Reset Redux auth state before each test
    store.dispatch(logout());
    // Clear localStorage
    localStorage.clear();
    // Set default language to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("maintains navbar login state after page refresh", async () => {
    // Initial login (without token in state)
    const testUser = { id: 5, username: "persistedUser" };
    
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
      store.dispatch(loginSuccess(testUser));
    });
    
    // Verify navbar updated - should now show profile link
    const profileLink = await screen.findByTestId("my-profile-link");
    expect(profileLink).toHaveAttribute("href", `/user/${testUser.id}`);
    
    // Verify auth links are hidden after login
    expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();

    // Simulate page refresh by creating a new store that loads from localStorage
    const newStore = createStore();
    
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
    await waitFor(() => {
      const refreshedProfileLink = screen.getByTestId("my-profile-link");
      expect(refreshedProfileLink).toHaveAttribute("href", `/user/${testUser.id}`);
    });
    
    // Verify auth links are hidden
    expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();

    // Verify no token in state
    const refreshedState = newStore.getState().auth;
    expect(refreshedState).toEqual({
      isAuthenticated: true,
      user: testUser
    });
    // Token should not be present in the state
    expect('token' in refreshedState).toBe(false);
  });
});
