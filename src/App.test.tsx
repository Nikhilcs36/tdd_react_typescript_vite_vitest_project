import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import i18n from "./locale/i18n";
import userEvent from "@testing-library/user-event";

describe("App", () => {
  it("renders the App component", () => {
    render(<App />);

    screen.debug();
  });
});

describe("Routing", () => {
  /**
   * Pushes a fake history entry, clears localStorage,
   * sets auth on /user routes, sets language, and renders App.
   */
  const setup = (path: string, lang: string, authenticated = false) => {
    window.localStorage.clear();
    window.history.pushState({}, "", path);

    if (authenticated || path.startsWith("/user")) {
      window.localStorage.setItem("authToken", "mock-jwt-token");
      const userId = path.split("/")[2] || "";
      window.localStorage.setItem("userId", userId);
    }

    // Change the language before rendering
    act(() => {
      i18n.changeLanguage(lang);
    });

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
    setup(path, "en");
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
      setup(path, "en");
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
    setup("/", lang);
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
      setup("/", lang);

      const loginLink = screen.getByRole("link", { name: linkText });
      fireEvent.click(loginLink);

      const loginPage = screen.getByTestId("login-page");
      expect(loginPage).toBeInTheDocument();
    }
  );
  // user page link test
  it("navigates to user page when clicking the username on user list", async () => {
    setup("/", "en", /* authenticated = */ true);

    const user = await screen.findByText("user2");
    userEvent.click(user);

    // Check if the user page loads
    const page = await screen.findByTestId("user-page");
    expect(page).toBeInTheDocument();
  });
});

describe("Navbar styling and layout", () => {
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
      "background-color: rgb(156 163 175 / var(--tw-bg-opacity, 1))"
    ); // bg-gray-400
    expect(navbar).toHaveStyleRule(
      "color: rgb(255 255 255 / var(--tw-bg-opacity, 1))"
    ); // text-white
    expect(navbar).toHaveStyleRule(
      "box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)"
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
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each`
    lang    | expectedDir | linkTextHome  | linkTextSignup         | linkTextLogin
    ${"en"} | ${"ltr"}    | ${"Home"}     | ${"Sign Up"}           | ${"Login"}
    ${"ml"} | ${"ltr"}    | ${"ഹോം"}      | ${"രജിസ്റ്റർ ചെയ്യുക"} | ${"ലോഗിൻ"}
    ${"ar"} | ${"rtl"}    | ${"الرئيسية"} | ${"تسجيل حساب جديد"}   | ${"تسجيل الدخول"}
  `(
    "should set document.dir to $expectedDir and show correct navbar texts in $lang",
    ({ lang, expectedDir, linkTextHome, linkTextSignup, linkTextLogin }) => {
      // Change the language before rendering
      act(() => {
        i18n.changeLanguage(lang);
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
  const setup = (path: string, lang: string) => {
    window.history.pushState({}, "", path);

    // Change the language before rendering
    act(() => {
      i18n.changeLanguage(lang);
    });

    render(<App />);
  };

  const mockAuth = (authenticated: boolean) => {
    if (authenticated) {
      localStorage.setItem("authToken", "mock-token");
      localStorage.setItem("userId", "1");
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
    }
  };

  afterEach(() => {
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
        mockAuth(true);
        setup("/", lang);

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
        mockAuth(false);
        setup("/", lang);

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
