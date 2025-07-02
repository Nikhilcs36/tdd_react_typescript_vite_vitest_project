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
import { loginSuccess, logoutSuccess } from "./store/actions";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  axiosApiServiceLogin,
  fetchApiServiceLogout,
} from "./services/apiService";
import { fillAndSubmitLoginForm } from "./tests/testUtils";
import LoginPageWrapper from "./page/LoginPage";

// Helper function to set up authenticated state
const mockAuth = (
  isAuthenticated: boolean,
  user = {
    id: 1,
    username: "user1",
    token: "mock-jwt-token",
    email: "user1@mail.com",
  }
) => {
  if (isAuthenticated) {
    store.dispatch(loginSuccess(user));
  } else {
    store.dispatch(logoutSuccess());
  }
};

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
    store.dispatch(logoutSuccess());
    // Clear localStorage
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
    user = {
      id: 1,
      username: "user1",
      token: "mock-jwt-token",
      email: "user1@mail.com",
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
              token: user.token,
              email: "user1@mail.com",
            }
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
    const mockUser = {
      id: 1,
      username: "user1",
      token: "mock-jwt-token",
      email: "user1@mail.com",
    };
    store.dispatch(loginSuccess(mockUser));

    // Render the App component (it will now render based on the authenticated state)
    render(<App />);

    // Wait for the "My Profile" link to appear in the navbar (it's conditional on auth state)
    const myProfileLink = screen.getByTestId("my-profile-link");

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
    // Setup authenticated user as user2 (ID: 2) - this user will be filtered from the user list
    const mockUser2 = {
      id: 2,
      username: "user2",
      token: "mock-jwt-token",
      email: "user2@mail.com",
    };
    store.dispatch(loginSuccess(mockUser2));
    setup("/", "en", true, mockUser2); // Setup with authenticated state and user object

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
      expect(state.auth.user?.username).toBe("user@example.com");
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
    await act(async () => {
      store.dispatch(logoutSuccess());
    });

    // Clear localStorage as a precaution
    localStorage.clear();
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
    await act(async () => {
      store.dispatch(logoutSuccess());
    });

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
  // Set default language to English
  beforeEach(async () => {
    // Make beforeEach async
    // Reset Redux auth state
    await act(async () => {
      store.dispatch(logoutSuccess());
    });

    // Clear localStorage
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
      token: "mock-jwt-token",
      email: "user1@mail.com",
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
      expect(postSpy).toHaveBeenCalledWith("/api/1.0/logout");
    });

    // Auth state assertions
    const authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();
    expect(authState.token).toBeNull();

    // UI assertions
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
    expect(screen.queryByTestId("logout-link")).not.toBeInTheDocument();

    // Navigation assertion
    expect(screen.getByTestId("home-page")).toBeInTheDocument();

    // Cleanup
    postSpy.mockRestore();
  });
});

describe("Navbar persistence with localStorage", () => {
  beforeEach(async () => {
    // Reset Redux auth state before each test
    await act(async () => {
      store.dispatch(logoutSuccess());
    });

    // Clear localStorage
    localStorage.clear();
    // Set default language to English
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("maintains navbar login state after page refresh", async () => {
    // Initial login (without token in state)
    const testUser = {
      id: 5,
      username: "persistedUser",
      token: "mock-jwt-token",
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
      store.dispatch(loginSuccess({ ...testUser, token: "mock-jwt-token" }));
    });

    // Verify navbar updated - should now show profile link
    const profileLink = await screen.getByTestId("my-profile-link");
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
      expect(refreshedProfileLink).toHaveAttribute(
        "href",
        `/user/${testUser.id}`
      );
    });

    // Verify auth links are hidden
    expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signup-link")).not.toBeInTheDocument();

    // Verify token in state
    const refreshedState = newStore.getState().auth;
    expect(refreshedState).toEqual({
      isAuthenticated: true,
      user: { id: 5, username: "persistedUser" },
      token: "mock-jwt-token",
    });
  });
});
