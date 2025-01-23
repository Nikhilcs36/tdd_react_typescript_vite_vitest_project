import { describe, expect, it } from "vitest";
import SignUpPage from "./SignUpPage";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axios from "axios";
import { vi } from "vitest";
import { fillAndSubmitSignUpForm } from "../tests/testUtils";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

describe("signup page", () => {
  describe("layout", () => {
    it("has header", () => {
      render(<SignUpPage />);
      // const header = screen.queryByRole('heading', { name: 'sign up1' });
      const header = screen.getByRole("heading", { name: "Sign Up" });
      /*  getByRole is more appropriate than queryByRole. If the element isn't found, getByRole
        will throw an error, making debugging easier.*/
      expect(header).toBeInTheDocument();
    });
    it("has user name", () => {
      render(<SignUpPage />);
      const input = screen.getByLabelText("Username");
      expect(input).toBeInTheDocument();
    });
    it("has user email", () => {
      render(<SignUpPage />);
      const input = screen.getByLabelText("E-mail");
      expect(input).toBeInTheDocument();
    });
    it("has user password", () => {
      render(<SignUpPage />);
      const input = screen.getByLabelText("Password");
      expect(input).toBeInTheDocument();
    });
    it("has password type for password input", () => {
      render(<SignUpPage />);
      const input = screen.getByLabelText<HTMLInputElement>("Password");
      expect(input.type).toBe("password");
    });
    it("has password type for password repeat input", () => {
      render(<SignUpPage />);
      const input = screen.getByLabelText<HTMLInputElement>("Password Repeat");
      expect(input.type).toBe("password");
    });
    it("has signup button", () => {
      render(<SignUpPage />);
      const button = screen.queryByRole("button", { name: "Sign Up" });
      expect(button).toBeInTheDocument();
    });
    it("disable the button initially", () => {
      render(<SignUpPage />);
      const button = screen.queryByRole("button", { name: "Sign Up" });
      expect(button).toBeDisabled();
    });
  });
  describe("style Tailwind (twin.macro)", () => {
    it("has a signup button styled correctly when disabled", () => {
      render(<SignUpPage />);
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
      render(<SignUpPage />);
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
  });
  describe("Interactions", () => {
    it("enables the button when password and password repeat fields have the same value", async () => {
      render(<SignUpPage />);
      const passwordInput = screen.getByLabelText("Password");
      const passwordRepeatInput = screen.getByLabelText("Password Repeat");

      await userEvent.type(passwordInput, "Password1");
      await userEvent.type(passwordRepeatInput, "Password1");

      const button = screen.getByRole("button", { name: "Sign Up" });
      expect(button).toBeEnabled();
    });
    it("sends username, email and password to backend after submit a button", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } });
      render(<SignUpPage />);

      const formData = {
        username: "user1",
        email: "user1@",
        password: "Password1",
        passwordRepeat: "Password1",
      };

      await fillAndSubmitSignUpForm(formData);

      expect(mockedAxios.post).toHaveBeenCalledWith("/api/1.0/users", formData);
    });
    it("re-enables the button when the API call fails", async () => {
      // Simulate failed API response
      mockedAxios.post.mockRejectedValue({
        response: {
          data: {
            path: "/api/1.0/users",
            timestamp: 1737216419142,
            message: "Validation Failure",
            validationErrors: { email: "E-mail is not valid" },
          },
        },
      });

      render(<SignUpPage />);

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
    it("disables the button when the API call succeeds", async () => {
      mockedAxios.post.mockResolvedValue({ data: { message: "User created" } }); // successful API response

      render(<SignUpPage />);

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

      render(<SignUpPage />);
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

      render(<SignUpPage />);

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
    describe("validationErrors", () => {
      it("intercepts API requests and returns mock data with username, email, password validation errors", async () => {
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "",
            email: "invalid-email",
            password: "short",
            passwordRepeat: "short",
          }),
        });
        const data = await response.json();
        expect(data.message).toBe("Validation Failure");

        // Assertions for the overall response
        expect(response.status).toBe(400); // Ensure the status is 400 for validation errors
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors
        expect(data.validationErrors).toEqual({
          username: "Username cannot be null",
          email: "E-mail is not valid",
          password: "Password must have at least 6 characters",
        });
      });

      it("returns validation error for email in use", async () => {
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "validUsername",
            email: "existing@example.com", // same email is added in mock handler
            password: "Valid123",
            passwordRepeat: "Valid123",
          }),
        });

        const data = await response.json();

        // Assertions for the overall response
        expect(response.status).toBe(400);
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors
        expect(data.validationErrors).toEqual({
          email: "E-mail in use",
        });
      });

      it("returns validation error for username length", async () => {
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "usr",
            email: "valid@example.com",
            password: "Valid123",
            passwordRepeat: "Valid123",
          }),
        });

        const data = await response.json();

        // Assertions for the overall response
        expect(response.status).toBe(400);
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors
        expect(data.validationErrors).toEqual({
          username: "Must have min 4 and max 32 characters",
        });
      });

      it("returns validation error for password complexity", async () => {
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "validUsername",
            email: "valid@example.com",
            password: "simple",
            passwordRepeat: "simple",
          }),
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
      });
      it("returns validation error for password mismatch", async () => {
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "validUsername",
            email: "valid@example.com",
            password: "ComplexPass1",
            passwordRepeat: "MismatchPass1",
          }),
        });

        const data = await response.json();

        // Assertions for the overall response
        expect(response.status).toBe(400);
        expect(data.message).toBe("Validation Failure");

        // Assertions for validation errors
        expect(data.validationErrors).toEqual({
          passwordRepeat: "password_mismatch",
        });
      });
      it("returns validation error when password is null", async () => {
        const response = await fetch("/api/1.0/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "validUsername",
            email: "valid@example.com",
            password: null, // Password is explicitly set to null
            passwordRepeat: null,
          }),
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
      });
    });
  });
});
