import { describe, expect, it } from "vitest";
import SignUpPage from "./SignUpPage";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axios from "axios";
import { vi, beforeEach } from "vitest";
import { fillAndSubmitSignUpForm } from "../tests/testUtils";
import { axiosApiService, fetchApiService } from "../services/apiService";
import { defaultService } from "../services/defaultService";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("signup page", () => {
  describe("layout", () => {
    it("has header", () => {
      render(<SignUpPage apiService={defaultService} />);
      // const header = screen.queryByRole('heading', { name: 'sign up1' });
      const header = screen.getByRole("heading", { name: "Sign Up" });
      /*  getByRole is more appropriate than queryByRole. If the element isn't found, getByRole
        will throw an error, making debugging easier.*/
      expect(header).toBeInTheDocument();
    });
    it("has user name", () => {
      render(<SignUpPage apiService={defaultService} />);
      const input = screen.getByLabelText("Username");
      expect(input).toBeInTheDocument();
    });
    it("has user email", () => {
      render(<SignUpPage apiService={defaultService} />);
      const input = screen.getByLabelText("E-mail");
      expect(input).toBeInTheDocument();
    });
    it("has user password", () => {
      render(<SignUpPage apiService={defaultService} />);
      const input = screen.getByLabelText("Password");
      expect(input).toBeInTheDocument();
    });
    it("has password type for password input", () => {
      render(<SignUpPage apiService={defaultService} />);
      const input = screen.getByLabelText<HTMLInputElement>("Password");
      expect(input.type).toBe("password");
    });
    it("has password type for password repeat input", () => {
      render(<SignUpPage apiService={defaultService} />);
      const input = screen.getByLabelText<HTMLInputElement>("Password Repeat");
      expect(input.type).toBe("password");
    });
    it("has signup button", () => {
      render(<SignUpPage apiService={defaultService} />);
      const button = screen.queryByRole("button", { name: "Sign Up" });
      expect(button).toBeInTheDocument();
    });
    it("disable the button initially", () => {
      render(<SignUpPage apiService={defaultService} />);
      const button = screen.queryByRole("button", { name: "Sign Up" });
      expect(button).toBeDisabled();
    });
  });

  describe("style Tailwind (twin.macro)", () => {
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

      const passwordInput = screen.getByLabelText("Password");
      const passwordRepeatInput = screen.getByLabelText("Password Repeat");

      await userEvent.type(passwordInput, "Password1");
      await userEvent.type(passwordRepeatInput, "Password1");

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

      const formData = {
        username: "user1",
        email: "user10@gmail.com",
        password: "Password1",
        passwordRepeat: "Password1",
      };

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
  });

  describe("Interactions", () => {
    it("enables the button when password and password repeat fields have the same value", async () => {
      render(<SignUpPage apiService={defaultService} />);
      const passwordInput = screen.getByLabelText("Password");
      const passwordRepeatInput = screen.getByLabelText("Password Repeat");

      await userEvent.type(passwordInput, "Password1");
      await userEvent.type(passwordRepeatInput, "Password1");

      const button = screen.getByRole("button", { name: "Sign Up" });
      expect(button).toBeEnabled();
    });
    it("sends username, email and password to backend after submit a button", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } });
      render(<SignUpPage apiService={axiosApiService} />);

      const formData = {
        username: "user1",
        email: "user1@",
        password: "Password1",
        passwordRepeat: "Password1",
      };

      await fillAndSubmitSignUpForm(formData);

      expect(mockedAxios.post).toHaveBeenCalledWith("/api/1.0/users", formData);
    });
    it("disables the button when the API call succeeds", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } }); // successful API response

      render(<SignUpPage apiService={axiosApiService} />);

      const formData = {
        username: "user1",
        email: "user1@gmail.com",
        password: "Password1",
        passwordRepeat: "Password1",
      };

      await fillAndSubmitSignUpForm(formData); // test utility function to fill the sign-up form.

      expect(mockedAxios.post).toHaveBeenCalledWith("/api/1.0/users", formData);

      const button = screen.getByRole("button", { name: "Sign Up" });
      expect(button).toBeDisabled();
    });
    it("re-enables the button when a network error occurs", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network Error")); // network error

      render(<SignUpPage apiService={axiosApiService} />);
      const formData = {
        username: "user1",
        email: "user1@",
        password: "Password1",
        passwordRepeat: "Password1",
      };

      await fillAndSubmitSignUpForm(formData);

      expect(mockedAxios.post).toHaveBeenCalledWith("/api/1.0/users", formData);

      const button = screen.getByRole("button", { name: "Sign Up" });
      expect(button).toBeEnabled();
    });
    it("displays a success message after successful signup", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } }); // successful API response

      render(<SignUpPage apiService={axiosApiService} />);

      const formData = {
        username: "user1",
        email: "user1@gmail.com",
        password: "Password1",
        passwordRepeat: "Password1",
      };

      await fillAndSubmitSignUpForm(formData);

      // Query the success message by test ID
      const successMessage = screen.getByTestId("success-message");

      // Verify the content
      expect(successMessage).toHaveTextContent("User created successfully!");
      expect(successMessage).toHaveTextContent(
        "Check your email for verification."
      );
    });

    describe("backend and frontend validationErrors in signup form expected", () => {
      it("returns validation error when password is null", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const formData = {
          username: "testuser",
          email: "valid@example.com",
        };

        await fillAndSubmitSignUpForm(formData);

        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        // Assertions for the overall response
        expect(response.status).toBe(400);
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors
        expect(data.validationErrors).toEqual({
          password: "Password cannot be null",
          passwordRepeat: "password_repeat_null",
        });

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeDisabled();

        // error message is not show because signup button is not enabled (password and password repeat are missmached)
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
          //returns validation error for username required
          formData: {
            username: "",
            email: "user@example.com",
            password: "ValidPass123",
            passwordRepeat: "ValidPass123",
          },
          expectedError: {
            key: "username",
            backendError: "Username cannot be null",
            frontendError: "Username is required.",
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
        it("validationErrors ensure the backend API and frontend works as expected", async () => {
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

    describe("input validationErrors in signup form expected", () => {
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
  });
});
