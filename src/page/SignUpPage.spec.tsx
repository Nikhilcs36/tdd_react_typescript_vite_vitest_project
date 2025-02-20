import { describe, expect, it } from "vitest";
import SignUpPage from "./SignUpPage";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axios from "axios";
import { vi, beforeEach } from "vitest";
import { fillAndSubmitSignUpForm } from "../tests/testUtils";
import { axiosApiService, fetchApiService } from "../services/apiService";
import { defaultService } from "../services/defaultService";
import "../locale/i18n";
import LanguageSwitcher from "../locale/languageSwitcher";
import i18n from "../locale/i18n";
import { Form } from "./SignUpPage";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("signup page", () => {
  describe("Layout", () => {
    beforeEach(() => {
      render(<SignUpPage apiService={defaultService} />);
    });

    it("displays required elements", () => {
      expect(
        screen.getByRole("heading", { name: "Sign Up" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Password Repeat")).toBeInTheDocument();
    });

    it.each(["Password", "Password Repeat"])(
      "%s field has password type",
      (label) => {
        const input = screen.getByLabelText<HTMLInputElement>(label);
        expect(input.type).toBe("password");
      }
    );

    describe("Submit Button", () => {
      it("exists and is disabled initially", () => {
        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
      });
    });
  });

  describe("style Tailwind (twin.macro)", () => {
    const formData = {
      username: "user1",
      email: "user10@gmail.com",
      password: "Password1",
      passwordRepeat: "Password1",
    };

    it("has a signup button styled correctly when disabled", () => {
      render(<SignUpPage apiService={defaultService} />);
      const button = screen.getByRole("button", { name: "Sign Up" });

      // Expect the button to be disabled
      expect(button).toBeDisabled();

      // Test specific styles applied when disabled
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(156 163 175 / var(--tw-bg-opacity, 1))"
      ); // Tailwind gray-400
      expect(button).toHaveStyleRule("cursor", "not-allowed");
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(156 163 175 / var(--tw-bg-opacity, 1))",
        { modifier: ":hover" }
      ); // Tailwind gray-400
    });
    it("has a signup button styled correctly when enabled", async () => {
      render(<SignUpPage apiService={defaultService} />);
      const button = screen.getByRole("button", { name: "Sign Up" });

      await fillAndSubmitSignUpForm(formData, false); // submit set as false

      // Expect the button to be enabled
      expect(button).toBeEnabled();

      // Test specific styles applied when enabled
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(59 130 246 / var(--tw-bg-opacity, 1))"
      ); // Tailwind gray-400
      expect(button).toHaveStyleRule("border-radius", "0.25rem");
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(37 99 235 / var(--tw-bg-opacity, 1))",
        { modifier: ":hover" }
      ); // Tailwind gray-400
    });
    it("displays validation error messages styles", async () => {
      render(<SignUpPage apiService={defaultService} />);

      const fields = [
        { label: "Username", testId: "username-error", inputValue: "a" },
        { label: "E-mail", testId: "email-error", inputValue: "invalid-email" },
        { label: "Password", testId: "password-error", inputValue: "123" },
        {
          label: "Password Repeat",
          testId: "passwordRepeat-error",
          inputValue: "456",
        },
      ];

      for (const field of fields) {
        const input = screen.getByLabelText(field.label);
        await userEvent.type(input, field.inputValue);

        // Wait for validation error to appear
        const errorMessage = await screen.findByTestId(field.testId);
        expect(errorMessage).toBeInTheDocument();

        // Check styles for validation error message
        expect(errorMessage).toHaveStyleRule(
          "color",
          "rgb(185 28 28 / var(--tw-text-opacity, 1))"
        ); // Tailwind red-700
        expect(errorMessage).toHaveStyleRule("font-size", "0.875rem"); // Tailwind text-sm
      }
    });
    it("displays success message styles", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } }); // successful API response
      render(<SignUpPage apiService={axiosApiService} />);

      await fillAndSubmitSignUpForm(formData);

      // Query the success message by test ID
      const successMessage = screen.getByTestId("success-message");
      expect(successMessage).toBeVisible();

      // Check styles for success message
      expect(successMessage).toHaveStyleRule(
        "color",
        "rgb(21 128 61 / var(--tw-text-opacity, 1))"
      ); // Tailwind green-700
      expect(successMessage).toHaveStyleRule(
        "background-color",
        "rgb(220 252 231 / var(--tw-bg-opacity, 1))"
      ); // Tailwind green-100
      expect(successMessage).toHaveStyleRule("text-align", "center");
    });

    describe("Dynamic Form styled component based on language", () => {
      const testCases = [
        { lang: "ml", expected: "36rem", label: "max-w-xl" },
        { lang: "ar", expected: "28rem", label: "max-w-md" },
        { lang: "en", expected: "24rem", label: "max-w-sm" },
      ];

      it.each(testCases)(
        "should have $label ($expected) when lang is $lang",
        ({ lang, expected }) => {
          const { container } = render(<Form lang={lang} />);
          expect(container.firstChild).toHaveStyleRule("max-width", expected);
        }
      );
    });
  });

  describe("Interactions", () => {
    const defaultFormData = {
      username: "user1",
      email: "user1@gmail.com",
      password: "Password1",
      passwordRepeat: "Password1",
    };

    it("enables the button when all signup input fields have value", async () => {
      render(<SignUpPage apiService={defaultService} />);

      await fillAndSubmitSignUpForm(defaultFormData, false); // submit set as false

      expect(screen.getByRole("button", { name: "Sign Up" })).toBeEnabled();
    });

    it("sends username, email, and password to backend after submit", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } });
      render(<SignUpPage apiService={axiosApiService} />);

      await fillAndSubmitSignUpForm(defaultFormData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/users",
        defaultFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": "en",
          }),
        })
      );
    });

    it("disables the button after successful API call", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } });
      render(<SignUpPage apiService={axiosApiService} />);

      await fillAndSubmitSignUpForm(defaultFormData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/users",
        defaultFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": "en",
          }),
        })
      );

      expect(screen.getByRole("button", { name: "Sign Up" })).toBeDisabled();
    });

    it("re-enables the button on network error", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network Error"));
      render(<SignUpPage apiService={axiosApiService} />);

      await fillAndSubmitSignUpForm(defaultFormData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/users",
        defaultFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": "en",
          }),
        })
      );

      expect(screen.getByRole("button", { name: "Sign Up" })).toBeEnabled();
    });

    it("displays success message after successful signup", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } });
      render(<SignUpPage apiService={axiosApiService} />);

      await fillAndSubmitSignUpForm(defaultFormData);

      const successMessage = screen.getByTestId("success-message");
      expect(successMessage).toHaveTextContent("User created successfully!");
      expect(successMessage).toHaveTextContent(
        "Check your email for verification."
      );
    });

    describe("backend and frontend validationErrors in signup form expected", () => {
      it("returns validation error when signup form inputs are null", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const fields = [
          { label: "Username", testId: "username-error" },
          { label: "E-mail", testId: "email-error" },
          { label: "Password", testId: "password-error" },
          { label: "Password Repeat", testId: "passwordRepeat-error" },
        ];

        // Handle each field individually with proper sequencing
        for (const field of fields) {
          const input = screen.getByLabelText(field.label);

          // Simulate user interaction
          await userEvent.type(input, "dummy");
          await userEvent.clear(input);
          fireEvent.blur(input);

          const error = await screen.findByTestId(field.testId);
          expect(error).toBeInTheDocument();
        }

        // Assertions for validation errors frontend
        await waitFor(() => {
          expect(screen.getByTestId("username-error")).toHaveTextContent(
            "Username is required."
          );
          expect(screen.getByTestId("email-error")).toHaveTextContent(
            "Email is required."
          );
          expect(screen.getByTestId("password-error")).toHaveTextContent(
            "Password is required."
          );
          expect(screen.getByTestId("passwordRepeat-error")).toHaveTextContent(
            "Confirm your password."
          );
        });

        // backend
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        // Assertions for the overall response
        expect(response.status).toBe(400);
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors backend
        expect(data.validationErrors).toEqual({
          username: "Username cannot be null",
          email: "E-mail cannot be null",
          password: "Password cannot be null",
          passwordRepeat: "password_repeat_null",
        });

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeDisabled();
      });

      const testCases = [
        {
          //returns validation error for username length
          formData: {
            username: "a",
            email: "user@example.com",
            password: "ValidPass123",
            passwordRepeat: "ValidPass123",
          },
          expectedError: {
            key: "username",
            backendError: "Must have min 4 and max 32 characters",
            frontendError: "Username must be 4-32 characters.",
          },
        },
        {
          // returns validation error for email not valid
          formData: {
            username: "validUser",
            email: "invalid-email",
            password: "ValidPass123",
            passwordRepeat: "ValidPass123",
          },
          expectedError: {
            key: "email",
            backendError: "E-mail is not valid",
            frontendError: "Enter a valid email (e.g., user@example.com).",
          },
        },
        {
          // returns validation error for email in use
          formData: {
            username: "validUser",
            email: "existing@example.com", // this email is added in mocks/handlers.ts for error validation
            password: "ValidPass123",
            passwordRepeat: "ValidPass123",
          },
          expectedError: {
            key: "email",
            backendError: "E-mail in use",
            frontendError: "Email is already in use.",
          },
        },
        {
          //returns validation error for password length
          formData: {
            username: "validUser",
            email: "user@example.com",
            password: "123",
            passwordRepeat: "123",
          },
          expectedError: {
            key: "password",
            backendError: "Password must have at least 6 characters",
            frontendError: "Password must be 6+ characters.",
          },
        },
        {
          //returns validation error for password complexity
          formData: {
            username: "validUser",
            email: "user@example.com",
            password: "1234567",
            passwordRepeat: "1234567",
          },
          expectedError: {
            key: "password",
            backendError:
              "Password must have at least 1 uppercase, 1 lowercase letter and 1 number",
            frontendError: "Use upper, lower, and a number.",
          },
        },
        {
          // returns validation error for password repeat mismatch
          formData: {
            username: "validUser",
            email: "user@example.com",
            password: "ValidPass123",
            passwordRepeat: "456",
          },
          expectedError: {
            key: "passwordRepeat",
            backendError: "password_mismatch",
            frontendError: "Passwords don't match.",
          },
        },
      ];

      testCases.forEach(({ formData, expectedError }) => {
        it("validationErrors ensure the backend API and frontend works as expected after submit signup", async () => {
          render(<SignUpPage apiService={fetchApiService} />);

          await fillAndSubmitSignUpForm(formData);

          // msw API integration
          const response = await fetch("/api/1.0/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          // backend API response
          const data = await response.json();
          expect(response.status).toBe(400);
          expect(data.validationErrors[expectedError.key]).toBe(
            expectedError.backendError
          );

          // UI assertions
          const errorMessage = await screen.findByTestId(
            `${expectedError.key}-error`
          );
          expect(errorMessage).toHaveTextContent(expectedError.frontendError);

          // State assertion
          expect(
            screen.getByRole("button", { name: "Sign Up" })
          ).toBeDisabled();
        });
      });
    });

    describe("input validationErrors in signup form expected before submit", () => {
      it("signup input validation error messages", async () => {
        render(<SignUpPage apiService={defaultService} />);

        const fields = [
          {
            label: "Username",
            testId: "username-error",
            inputValue: "a",
            validationError: "Username must be 4-32 characters.",
          },
          {
            label: "E-mail",
            testId: "email-error",
            inputValue: "invalid-email",
            validationError: "Enter a valid email (e.g., user@example.com).",
          },
          {
            label: "Password",
            testId: "password-error",
            inputValue: "123",
            validationError: "Password must be 6+ characters.",
          },
          {
            label: "Password Repeat",
            testId: "passwordRepeat-error",
            inputValue: "456",
            validationError: "Passwords don't match.",
          },
        ];

        for (const field of fields) {
          const input = screen.getByLabelText(field.label);
          await userEvent.type(input, field.inputValue);

          // Wait for validation error to appear
          const errorMessage = await screen.findByTestId(field.testId);
          expect(errorMessage).toBeInTheDocument();
          expect(errorMessage).toHaveTextContent(field.validationError);

          const button = screen.getByRole("button", { name: "Sign Up" });
          expect(button).toBeDisabled();
        }
      });
    });

    describe("SignupForm", () => {
      it("disables autocomplete on username input", () => {
        render(<SignUpPage apiService={defaultService} />);
        const usernameInput = screen.getByLabelText("Username");
        expect(usernameInput).toHaveAttribute("autocomplete", "off");
      });

      it("disables autocomplete on email input", () => {
        render(<SignUpPage apiService={defaultService} />);
        const emailInput = screen.getByLabelText("E-mail");
        expect(emailInput).toHaveAttribute("autocomplete", "off");
      });
    });
  });
});

describe("i18n Integration for SignUpPage and LanguageSwitcher", () => {
  beforeEach(() => {
    // Reset language to default ('en') before each test.
    act(() => {
      i18n.changeLanguage("en");
    });
  });

  // Default Language Tests
  describe("Default Language", () => {
    it("renders SignUpPage in English by default", () => {
      render(<SignUpPage apiService={defaultService} />);
      expect(
        screen.getByRole("heading", { name: "Sign Up" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Password Repeat")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign Up" })
      ).toBeInTheDocument();
    });
  });

  describe("Language Change for SignUpPage", () => {
    it("renders SignUpPage in Malayalam when language is changed", async () => {
      await act(async () => {
        await i18n.changeLanguage("ml");
      });
      render(<SignUpPage apiService={defaultService} />);
      expect(
        screen.getByRole("heading", { name: "രജിസ്റ്റർ ചെയ്യുക" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("ഉപയോക്തൃനാമം")).toBeInTheDocument();
      expect(screen.getByLabelText("ഇമെയിൽ")).toBeInTheDocument();
      expect(screen.getByLabelText("പാസ്‌വേഡ്")).toBeInTheDocument();
      expect(
        screen.getByLabelText("പാസ്‌വേഡ് ആവർത്തിക്കുക")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "രജിസ്റ്റർ ചെയ്യുക" })
      ).toBeInTheDocument();
    });

    it("renders SignUpPage in Arabic when language is changed", async () => {
      await act(async () => {
        await i18n.changeLanguage("ar");
      });
      render(<SignUpPage apiService={defaultService} />);
      expect(
        screen.getByRole("heading", { name: "تسجيل حساب جديد" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("اسم المستخدم")).toBeInTheDocument();
      expect(screen.getByLabelText("البريد الإلكتروني")).toBeInTheDocument();
      expect(screen.getByLabelText("كلمة المرور")).toBeInTheDocument();
      expect(screen.getByLabelText("تأكيد كلمة المرور")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "تسجيل" })).toBeInTheDocument();
    });
  });

  // Error Message Tests..
  describe("Client-Side Error Translations with language changed", () => {
    const clientSideTestCases = [
      // English test cases:
      {
        lang: "en",
        field: "username",
        input: "a",
        errorKey: "Must have min 4 and max 32 characters",
        expectedError: "Username must be 4-32 characters.",
      },
      {
        lang: "en",
        field: "username",
        input: "",
        errorKey: "Username cannot be null",
        expectedError: "Username is required.",
      },
      {
        lang: "en",
        field: "email",
        input: "invalid",
        errorKey: "E-mail is not valid",
        expectedError: "Enter a valid email (e.g., user@example.com).",
      },
      {
        lang: "en",
        field: "email",
        input: "",
        errorKey: "E-mail cannot be null",
        expectedError: "Email is required.",
      },
      {
        lang: "en",
        field: "password",
        input: "123",
        errorKey: "Password must have at least 6 characters",
        expectedError: "Password must be 6+ characters.",
      },
      {
        lang: "en",
        field: "password",
        input: "",
        errorKey: "Password cannot be null",
        expectedError: "Password is required.",
      },
      {
        lang: "en",
        field: "passwordRepeat",
        input: "456",
        errorKey: "password_mismatch",
        expectedError: "Passwords don't match.",
      },
      {
        lang: "en",
        field: "passwordRepeat",
        input: "",
        errorKey: "password_repeat_null",
        expectedError: "Confirm your password.",
      },

      // Malayalam test cases:
      {
        lang: "ml",
        field: "username",
        input: "a",
        errorKey: "Must have min 4 and max 32 characters",
        expectedError: "ഉപയോക്തൃനാമം 4-32 പ്രതീകങ്ങൾ ആയിരിക്കണം.",
      },
      {
        lang: "ml",
        field: "username",
        input: "",
        errorKey: "Username cannot be null",
        expectedError: "ഉപയോക്തൃനാമം ആവശ്യമാണ്.",
      },
      {
        lang: "ml",
        field: "email",
        input: "invalid",
        errorKey: "E-mail is not valid",
        expectedError: "സാധുവായ ഇമെയിൽ നൽകുക (ഉദാ: user@example.com).",
      },
      {
        lang: "ml",
        field: "email",
        input: "",
        errorKey: "E-mail cannot be null",
        expectedError: "ഇമെയിൽ ആവശ്യമാണ്.",
      },
      {
        lang: "ml",
        field: "password",
        input: "123",
        errorKey: "Password must have at least 6 characters",
        expectedError: "പാസ്‌വേഡ് 6+ പ്രതീകങ്ങൾ ആയിരിക്കണം.",
      },
      {
        lang: "ml",
        field: "password",
        input: "",
        errorKey: "Password cannot be null",
        expectedError: "പാസ്‌വേഡ് ആവശ്യമാണ്.",
      },
      {
        lang: "ml",
        field: "passwordRepeat",
        input: "456",
        errorKey: "password_mismatch",
        expectedError: "പാസ്‌വേഡുകൾ യോജിക്കുന്നില്ല.",
      },
      {
        lang: "ml",
        field: "passwordRepeat",
        input: "",
        errorKey: "password_repeat_null",
        expectedError: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക.",
      },

      // Arabic test cases:
      {
        lang: "ar",
        field: "username",
        input: "a",
        errorKey: "Must have min 4 and max 32 characters",
        expectedError: "يجب أن يكون اسم المستخدم بين 4 و32 حرفًا.",
      },
      {
        lang: "ar",
        field: "username",
        input: "",
        errorKey: "Username cannot be null",
        expectedError: "يرجى إدخال اسم المستخدم.",
      },
      {
        lang: "ar",
        field: "email",
        input: "invalid",
        errorKey: "E-mail is not valid",
        expectedError:
          "يرجى إدخال بريد إلكتروني صحيح (مثال: user@example.com).",
      },
      {
        lang: "ar",
        field: "email",
        input: "",
        errorKey: "E-mail cannot be null",
        expectedError: "يرجى إدخال البريد الإلكتروني.",
      },
      {
        lang: "ar",
        field: "password",
        input: "123",
        errorKey: "Password must have at least 6 characters",
        expectedError: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
      },
      {
        lang: "ar",
        field: "password",
        input: "",
        errorKey: "Password cannot be null",
        expectedError: "يرجى إدخال كلمة المرور.",
      },
      {
        lang: "ar",
        field: "passwordRepeat",
        input: "456",
        errorKey: "password_mismatch",
        expectedError: "كلمتا المرور غير متطابقتين.",
      },
      {
        lang: "ar",
        field: "passwordRepeat",
        input: "",
        errorKey: "password_repeat_null",
        expectedError: "يرجى تأكيد كلمة المرور.",
      },
    ];

    it.each(clientSideTestCases)(
      "$lang: $errorKey",
      async ({ lang, field, input, expectedError }) => {
        // Change the current language.
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        render(<SignUpPage apiService={defaultService} />);

        // Get the translated label text for the field.
        const labelText = i18n.t(`signup.${field}`);
        // Query the input using the translated label.
        const inputField = screen.getByLabelText(labelText);

        if (input) {
          await userEvent.type(inputField, input);
        } else {
          // Type a dummy value so that an onChange event is triggered,
          // then clear the input.
          await userEvent.type(inputField, "dummy");
          await userEvent.clear(inputField);
        }
        // Fire a blur event to trigger the validation logic.
        fireEvent.blur(inputField);

        const error = await screen.findByTestId(`${field}-error`);
        expect(error).toHaveTextContent(expectedError);
      }
    );
  });

  // Success Message Tests

  describe("Success message in SignUpPage with language changed", () => {
    const formData = {
      username: "validUser",
      email: "valid@example.com",
      password: "ValidPass123",
      passwordRepeat: "ValidPass123",
    };

    const testCases = [
      {
        lang: "en",
        expectedMessages: [
          "User created successfully!",
          "Check your email for verification.",
        ],
      },
      {
        lang: "ml",
        expectedMessages: [
          "ഉപയോക്താവിനെ വിജയകരമായി സൃഷ്ടിച്ചു!",
          "സ്ഥിരീകരണത്തിനായി നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുക.",
        ],
      },
      {
        lang: "ar",
        expectedMessages: [
          "تم إنشاء المستخدم بنجاح!",
          "يرجى التحقق من بريدك الإلكتروني لإكمال التسجيل.",
        ],
      },
    ];

    it.each(testCases)(
      "$lang: displays success message after successful signup",
      async ({ lang, expectedMessages }) => {
        // Change the language.
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        // Simulate a successful API response.
        mockedAxios.post.mockResolvedValueOnce({
          data: { message: "User created" },
        });

        render(<SignUpPage apiService={axiosApiService} />);

        // Use the utility function to fill and submit the form.
        // The utility will change language (if needed) and fill out the form using i18n keys.
        await act(async () => {
          await fillAndSubmitSignUpForm(formData, true, lang);
        });

        const successMessage = await screen.findByTestId("success-message");

        expectedMessages.forEach((msg) => {
          expect(successMessage).toHaveTextContent(msg);
        });
      }
    );

    const languages = ["en", "ml", "ar"];
    it.each(languages)(
      "sends Accept-Language header as '%s' using axiosApiService",
      async (lang) => {
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        // Setup mock for axios.post.
        mockedAxios.post.mockResolvedValueOnce({
          data: { message: "User created" },
        });

        render(<SignUpPage apiService={axiosApiService} />);

        await fillAndSubmitSignUpForm(formData);

        // Verify that axios.post was called.
        expect(mockedAxios.post).toHaveBeenCalled();

        const callArgs = mockedAxios.post.mock.calls[0]; // [url, body, config]
        const config = callArgs[2];
        expect(config).toBeDefined();
        expect(config).toHaveProperty("headers.Accept-Language", lang);
      }
    );
    it.each(languages)(
      "sends Accept-Language header as '%s' using fetch ApiService",
      async (lang) => {
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        render(<SignUpPage apiService={fetchApiService} />);

        // Call the API via fetchApiService. MSW will intercept this call
        // and Accept-Language header as "languageReceived" in the response.(handlers.ts)
        const responseData = await fetchApiService.post(
          "/api/1.0/users",
          formData
        );

        expect(responseData).toHaveProperty("languageReceived", lang);
      }
    );
  });

  describe("LanguageSwitcher Style Test", () => {
    let container: HTMLElement;

    beforeEach(() => {
      const { container: cont } = render(<LanguageSwitcher />);
      // The LanguageSwitcher container is the first child.
      container = cont.firstChild as HTMLElement;
    });

    // Verify that the container is rendered.
    it("renders container", () => {
      expect(container).toBeInTheDocument();
    });

    // Test container style rules using test.each.
    const containerStyleRules: Array<[string, string]> = [
      ["position", "fixed"],
      ["z-index", "50"],
      ["bottom", "1rem"],
      ["right", "1rem"],
    ];

    it.each(containerStyleRules)(
      "container should have %s with value %s",
      (property, value) => {
        expect(container).toHaveStyleRule(property, value);
      }
    );

    // Define button test cases for each language button.
    const buttonTestCases = [
      {
        name: "English",
        expected: {
          "padding-left": "0.75rem", // Tailwind px-3
          "padding-right": "0.75rem",
          "padding-top": "0.25rem", // Tailwind py-1
          "padding-bottom": "0.25rem",
          "font-size": "0.875rem", // text-sm
          color: "rgb(30 64 175 / var(--tw-text-opacity, 1))", // text-blue-800
          "background-color": "rgb(219 234 254 / var(--tw-bg-opacity, 1))", // bg-blue-100
        },
      },
      {
        name: "മലയാളം",
        expected: {
          "padding-left": "0.75rem",
          "padding-right": "0.75rem",
          "padding-top": "0.25rem",
          "padding-bottom": "0.25rem",
          "font-size": "0.875rem",
          color: "rgb(22 101 52 / var(--tw-text-opacity, 1))", // text-green-800
          "background-color": "rgb(220 252 231 / var(--tw-bg-opacity, 1))", // bg-green-100
        },
      },
      {
        name: "العربية",
        expected: {
          "padding-left": "0.75rem",
          "padding-right": "0.75rem",
          "padding-top": "0.25rem",
          "padding-bottom": "0.25rem",
          "font-size": "0.875rem",
          color: "rgb(154 52 18 / var(--tw-text-opacity, 1))", // text-orange-800
          "background-color": "rgb(255 237 213 / var(--tw-bg-opacity, 1))", // bg-orange-100
        },
      },
    ];

    // Test each button's style using test.each.
    it.each(buttonTestCases)(
      "$name button has correct style",
      ({ name, expected }) => {
        const button = screen.getByRole("button", { name });
        expect(button).toBeInTheDocument();
        for (const [prop, value] of Object.entries(expected)) {
          expect(button).toHaveStyleRule(prop, value);
        }
      }
    );
  });

  describe("i18n languageChanged event updates document html attributes", () => {
    it.each([
      { lang: "en", expectedDir: "ltr" },
      { lang: "ml", expectedDir: "ltr" },
      { lang: "ar", expectedDir: "rtl" },
    ])(
      "should update document attributes when language is changed to $lang",
      async ({ lang, expectedDir }) => {
        // Change the language inside an act() block to ensure all state updates are flushed.
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        expect(document.documentElement.lang).toBe(lang);
        expect(document.documentElement.dir).toBe(expectedDir);
      }
    );
  });
});
