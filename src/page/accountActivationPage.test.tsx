import { render, screen, waitFor } from "@testing-library/react";
//import { MemoryRouter, Route, Routes } from "react-router-dom";
import AccountActivationPage from "./accountActivationPage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock axios API call
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.resetAllMocks();
});

/**
 * Utility function to render the AccountActivationPage component
 * within a test-friendly router environment.
 *
 * @param {string} initialPath - The initial URL path to simulate in the test.
 * @returns {RenderResult} - The result of the render function from @testing-library/react.
 *
 * Why is this needed?
 * - We use `MemoryRouter` instead of `BrowserRouter` to control the initial route.
 * - `initialEntries` allows us to simulate navigating to a specific path.
 * - `Routes` and `Route` ensure that the correct page is rendered based on the URL.
 * - This helps us test route-based behavior (e.g., extracting the token from the URL).
 */

const setup = (initialPath: string) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/activate/:token" element={<AccountActivationPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("Account Activation Page", () => {
  it("displays activation success message when token is valid", async () => {
    setup("/activate/123");

    const message = await screen.findByText("Account is Activated");
    expect(message).toBeInTheDocument();
  });

  it("sends activation request to backend and handles success", async () => {
    // Mock successful API response
    mockedAxios.post.mockResolvedValue({
      data: { message: "Account Activated" },
    });

    setup("/activate/12315");

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

    setup("/activate/invalid");

    const message = await screen.findByTestId("fail-message");
    expect(message).toBeInTheDocument();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/1.0/users/token/invalid"
    );
  });

  it("sends activation request after the token changes (first fail, then success, then fail again)", async () => {
    // Mock API response for the initial (failed) token
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { message: "Activation Failed" } },
    });

    setup("/activate/invalid");

    // Ensure API call was made for the first token
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/users/token/invalid"
      );
    });

    // Check that the failure message appears
    const failMessages = await screen.findAllByTestId("fail-message");
    expect(failMessages.length).toBeGreaterThan(0);

    // Mock API response for the new (successful) token
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: "Account Activated" },
    });

    // Simulate route change by re-rendering with a different entry
    await act(async () => {
      setup("/activate/valid-token");
    });

    // Ensure API call was made for the new token
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/users/token/valid-token"
      );
    });

    // Check that the success message appears
    const successMessage = await screen.findByTestId("success-message");
    expect(successMessage).toBeInTheDocument();

    // Mock API response for the new (failed) token
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { message: "Activation Failed" } },
    });

    // Simulate another route change with the same success token
    await act(async () => {
      setup("/activate/valid-token");
    });

    // Ensure API call was made again for the token
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/1.0/users/token/valid-token"
      );
    });

    const failMessagesAgain = await screen.findAllByTestId("fail-message");
    expect(failMessagesAgain.length).toBeGreaterThan(0);
  });

  it("displays spinner during activation API call", async () => {
    // Mock API response before rendering
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: "Account Activated" },
    });

    setup("/activate/5678");

    // Check if the spinner appears initially
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    // Wait for the success messageḍ
    await screen.findByTestId("success-message");

    // Ensure spinner disappears
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("displays spinner during second activation API call to the changed token", async () => {
    // Mock API response for the first activation attempt
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: "Account Activated" },
    });
  
    setup("/activate/1234");
  
    // Wait for the spinner to appear
    await screen.findByTestId("loading-spinner");
  
    // Wait for the success message to confirm activation
    await screen.findByTestId("success-message");
  
    // Ensure spinner disappears after the first activation
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  
    // Mock API response for the second activation attempt
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: "Activation failure" },
    });
  
    // Simulate route change by re-rendering with a different token
    setup("/activate/5678");
  
    await screen.findByTestId("loading-spinner");
    
    await waitFor(() => {
      screen.findByTestId("fail-message");
    });
    
    // Ensure the spinner disappears after the second activation attempt
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
  
});
