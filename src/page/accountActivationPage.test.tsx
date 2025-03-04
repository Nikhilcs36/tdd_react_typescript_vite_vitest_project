import { render, screen } from "@testing-library/react";
//import { MemoryRouter, Route, Routes } from "react-router-dom";
import AccountActivationPage from "./accountActivationPage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

// Mock axios API call
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Account Activation Page", () => {
  it("displays activation success message when token is valid", async () => {
    render(<AccountActivationPage token="123" />);

    const message = await screen.findByText("Account is Activated");
    expect(message).toBeInTheDocument();
  });

  it("sends activation request to backend and handles success", async () => {
    // Mock successful API response
    mockedAxios.post.mockResolvedValue({ data: {} });

    render(<AccountActivationPage token="12315" />);

    // Wait for success message
    const message = await screen.findByTestId("success-message");
    expect(message).toBeInTheDocument();

    expect(mockedAxios.post).toHaveBeenCalledWith("/api/1.0/users/token/12315");
  });

  it("sends activation request to backend and handles failure", async () => {
    // Mock failed API response
    mockedAxios.post.mockRejectedValue({
      response: { status: 400, data: { message: "Activation Failed" } },
    });

    render(<AccountActivationPage token="invalid" />);

    const message = await screen.findByTestId("fail-message");
    expect(message).toBeInTheDocument();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/1.0/users/token/invalid"
    );
  });
});
