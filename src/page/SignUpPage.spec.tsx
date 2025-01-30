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
    describe("validationErrors ensure the backend API and frontend works as expected", () => {
      it("intercepts API requests and returns mock data with username, email, password validation errors", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const formData = {
          username: "",
          email: "invalid-email",
          password: "short",
          passwordRepeat: "short",
        };

        // Simulate filling out the form and submitting
        await fillAndSubmitSignUpForm(formData);

        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await response.json();

        // Assertions for the overall response
        expect(response.status).toBe(400); // Ensure the status is 400 for validation errors
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors
        expect(data.validationErrors).toEqual({
          username: "Username cannot be null",
          email: "E-mail is not valid",
          password: "Password must have at least 6 characters",
        });

        // username-error message to appear in signup form
        const usernameErrorMessage = await screen.findByTestId(
          "username-error"
        );
        expect(usernameErrorMessage).toBeInTheDocument();
        expect(usernameErrorMessage).toHaveTextContent("Username is required.");

        // email-error message to appear in signup form
        const emailErrorMessage = await screen.findByTestId("email-error");
        expect(emailErrorMessage).toBeInTheDocument();
        expect(emailErrorMessage).toHaveTextContent(
          "Enter a valid email (e.g., user@example.com)."
        );

        // password-error message to appear in signup form
        const passwordErrorMessage = await screen.findByTestId(
          "password-error"
        );
        expect(passwordErrorMessage).toBeInTheDocument();
        expect(passwordErrorMessage).toHaveTextContent(
          "Password must be 6+ characters."
        );
      });

      it("returns validation error for email in use", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const formData = {
          username: "testusername",
          email: "existing@example.com", // this email is added in mocks/handlers.ts for error validation
          password: "Password1",
          passwordRepeat: "Password1",
        };

        // Simulate filling out the form and submitting
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
          email: "E-mail in use",
        });

        // email-error message to appear in signup form
        const emailErrorMessage = await screen.findByTestId("email-error");
        expect(emailErrorMessage).toBeInTheDocument();
        expect(emailErrorMessage).toHaveTextContent("Email is already in use.");
      });

      it("returns validation error for username length", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const formData = {
          username: "te",
          email: "valid@example.com",
          password: "Password1",
          passwordRepeat: "Password1",
        };

        // Simulate filling out the form and submitting
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
          username: "Must have min 4 and max 32 characters",
        });

        // username-error message to appear in signup form
        const usernameErrorMessage = await screen.findByTestId(
          "username-error"
        );
        expect(usernameErrorMessage).toBeInTheDocument();
        expect(usernameErrorMessage).toHaveTextContent(
          "Username must be 4-32 characters."
        );
      });

      it("returns validation error for password complexity", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const formData = {
          username: "testuser",
          email: "valid@example.com",
          password: "simple",
          passwordRepeat: "simple",
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
          password:
            "Password must have at least 1 uppercase, 1 lowercase letter and 1 number",
        });

        // password-error message to appear in signup form
        const passwordErrorMessage = await screen.findByTestId(
          "password-error"
        );
        expect(passwordErrorMessage).toBeInTheDocument();
        expect(passwordErrorMessage).toHaveTextContent(
          "Use upper, lower, and a number."
        );
      });

      it("returns validation error for password repeat mismatch", async () => {
        render(<SignUpPage apiService={fetchApiService} />);

        const formData = {
          username: "testuser",
          email: "valid@example.com",
          password: "ComplexPass1",
          passwordRepeat: "MismatchPass1",
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
          passwordRepeat: "password_mismatch",
        });

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeDisabled();

        //password-error message to appear in signup form
        const passwordErrorMessage = await screen.findByTestId(
          "passwordRepeat-error"
        );
        expect(passwordErrorMessage).toBeInTheDocument();
        expect(passwordErrorMessage).toHaveTextContent(
          "Passwords don't match."
        );
      });
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

        // this error message is not show because signup button is not enabled (password and password repeat are missmached)

        // // password-error message to appear in signup form
        // const passwordErrorMessage = await screen.findByTestId(
        //   "password-error"
        // );
        // expect(passwordErrorMessage).toBeInTheDocument();
        // expect(passwordErrorMessage).toHaveTextContent("Password is required.");

        // //  passwordRepeat-error message to appear in signup form
        // const passwordRepeatErrorMessage = await screen.findByTestId(
        //   "passwordRepeat-error"
        // );
        // expect(passwordRepeatErrorMessage).toBeInTheDocument();
        // expect(passwordRepeatErrorMessage).toHaveTextContent(
        //   "Confirm your password."
        // );
      });
    });
    describe("input validationErrors in signup form expected", () => {
      it("enables the button when the validation username-error in signup form", async () => {
        render(<SignUpPage apiService={axiosApiService} />);

        const formData = {
          username: "us",
          email: "user1@gmail.com",
          password: "Password1",
          passwordRepeat: "Password1",
        };

        await fillAndSubmitSignUpForm(formData);

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeEnabled();

        // username-error message to appear in signup form
        const usernameErrorMessage = await screen.findByTestId(
          "username-error"
        );
        expect(usernameErrorMessage).toBeInTheDocument();
        expect(usernameErrorMessage).toHaveTextContent(
          "Username must be 4-32 characters."
        );
      });
      it("enables the button when the validation email-error in signup form", async () => {
        render(<SignUpPage apiService={axiosApiService} />);

        const formData = {
          username: "usser253",
          email: "us",
          password: "Password1",
          passwordRepeat: "Password1",
        };

        await fillAndSubmitSignUpForm(formData);

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeEnabled();

        // email-error message to appear in signup form
        const emailErrorMessage = await screen.findByTestId("email-error");
        expect(emailErrorMessage).toBeInTheDocument();
        expect(emailErrorMessage).toHaveTextContent(
          "Enter a valid email (e.g., user@example.com)."
        );
      });
      it("enables the button when the validation passwordRepeat-error in signup form", async () => {
        render(<SignUpPage apiService={axiosApiService} />);

        const formData = {
          username: "user1",
          email: "user3@gmail.com",
          password: "Password2",
          passwordRepeat: "Password12",
        };

        await fillAndSubmitSignUpForm(formData);

        //  passwordRepeat-error message to appear in signup form
        const passwordRepeatErrorMessage = await screen.findByTestId(
          "passwordRepeat-error"
        );
        expect(passwordRepeatErrorMessage).toBeInTheDocument();
        expect(passwordRepeatErrorMessage).toHaveTextContent(
          "Passwords don't match."
        );

        const button = screen.getByRole("button", { name: "Sign Up" });
        expect(button).toBeDisabled();
      });
    });
  });
});
