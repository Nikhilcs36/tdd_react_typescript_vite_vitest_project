import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import i18n from "./locale/i18n";

describe("App", () => {
  it("renders the App component", () => {
    render(<App />);

    screen.debug();
  });
});

describe("Routing", () => {
  const setup = (path: string, lang: string) => {
    window.history.pushState({}, "", path);

    // Change the language before rendering
    act(() => {
      i18n.changeLanguage(lang);
    });

    render(<App />);
  };

  it.each`
    path         | pageTestId
    ${"/"}       | ${"home-page"}
    ${"/signup"} | ${"signup-page"}
    ${"/login"}  | ${"login-page"}
    ${"/user/1"} | ${"user-page"}
    ${"/user/2"} | ${"user-page"}
  `("displays $pageTestId when path is $path", ({ path, pageTestId }) => {
    setup(path, "en");
    const page = screen.queryByTestId(pageTestId);
    expect(page).toBeInTheDocument();
  });

  it.each`
    path         | pageTestId
    ${"/"}       | ${"signup-page"}
    ${"/"}       | ${"login-page"}
    ${"/"}       | ${"user-page"}
    ${"/signup"} | ${"home-page"}
    ${"/signup"} | ${"login-page"}
    ${"/signup"} | ${"user-page"}
    ${"/login"}  | ${"home-page"}
    ${"/login"}  | ${"signup-page"}
    ${"/login"}  | ${"user-page"}
    ${"/user/1"} | ${"home-page"}
    ${"/user/1"} | ${"signup-page"}
    ${"/user/1"} | ${"login-page"}
  `(
    "does not display $pageTestId when path is $path",
    ({ path, pageTestId }) => {
      setup(path, "en");
      const page = screen.queryByTestId(pageTestId);
      expect(page).not.toBeInTheDocument();
    }
  );

  it.each([
    ["Home", "Home", "en"], // English
    ["Sign Up", "Sign Up", "en"],

    ["Home", "Home", "ml"], // Malayalam
    ["Sign Up", "രജിസ്റ്റർ ചെയ്യുക", "ml"],

    ["Home", "Home", "ar"], // Arabic
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
      ["Login", "Login", "en"],
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
});
