import { describe, expect, it } from "vitest";
import SignUpPage from "./SignUpPage";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axios from "axios";
import { vi } from "vitest";

vi.mock("axios");

describe("signup page", () => {
  describe("layout", () => {
    it("has header", () => {
      render(<SignUpPage />);
      // const header = screen.queryByRole('heading', { name: 'sign up1' });
      const header = screen.getByRole("heading", { name: "Sign Up" });
      //  getByRole is more appropriate than queryByRole. If the element isn't found, getByRole
      //  will throw an error, making debugging easier.
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
      render(<SignUpPage />);
      const usernameInput = screen.getByLabelText("Username");
      const emailInput = screen.getByLabelText("E-mail");
      const passwordInput = screen.getByLabelText("Password");
      const passwordRepeatInput = screen.getByLabelText("Password Repeat");

      await userEvent.type(usernameInput, "user1");
      await userEvent.type(emailInput, "user1@gmail.com");
      await userEvent.type(passwordInput, "Password1");
      await userEvent.type(passwordRepeatInput, "Password1");

      const button = screen.getByRole("button", { name: "Sign Up" });
      await userEvent.click(button);

      // Assert axios post call
      expect(axios.post).toHaveBeenCalledWith("/api/1.0/users", {
        username: "user1",
        email: "user1@gmail.com",
        password: "Password1",
        passwordRepeat: "Password1",
      });
    });
  });
});
