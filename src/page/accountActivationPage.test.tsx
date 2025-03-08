import { render, screen, waitFor } from "@testing-library/react";
import AccountActivationPage from "./accountActivationPage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  ApiService,
  axiosApiServiceActivation,
  fetchApiServiceActivation,
} from "../services/apiService";

// Mock axios API call
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.restoreAllMocks(); // Clears all spies/mocks before each test
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

const setup = (initialPath: string, apiService: ApiService) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/activate/:token"
          element={<AccountActivationPage apiService={apiService} />}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("Account Activation Page", () => {
  it("displays activation success message when token is valid", async () => {
    setup("/activate/123", fetchApiServiceActivation);

    const message = await screen.findByText("Account is Activated");
    expect(message).toBeInTheDocument();
  });

  it("sends activation request to backend and handles success Unit tests (isolating the component logic)", async () => {
    // Mock successful API response
    mockedAxios.post.mockResolvedValue({
      data: { message: "Account Activated" },
    });

    setup("/activate/12315", axiosApiServiceActivation);

    // Wait for success message
    const message = await screen.findByTestId("success-message");
    expect(message).toBeInTheDocument();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/1.0/users/token/12315",
      expect.objectContaining({}),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Accept-Language": "en",
        }),
      })
    );
  });

  it("sends activation request to backend and handles success Integration tests (validating API interaction)", async () => {
    // Spy on the API call
    const apiSpy = vi.spyOn(fetchApiServiceActivation, "post");

    // Setup component with actual API service
    setup("/activate/12315", fetchApiServiceActivation);

    // Wait for success message
    const message = await screen.findByTestId("success-message");
    expect(message).toBeInTheDocument();

    // Ensure API function was called with the correct URL
    expect(apiSpy).toHaveBeenCalledWith("/api/1.0/users/token/12315");

    // Capture the return value of the spied function
    const response = await apiSpy.mock.results[0].value; // Get the first call's result

    // Validate the response data
    expect(response).toEqual(
      expect.objectContaining({ languageReceived: "en" })
    );
    expect(response).toEqual(
      expect.objectContaining({ message: "Account activated" })
    );
  });

  it("sends activation request to backend and handles failure unit test", async () => {
    // Mock failed API response
    mockedAxios.post.mockRejectedValue({
      response: { status: 400, data: { message: "Activation Failed" } },
    });

    setup("/activate/invalid", axiosApiServiceActivation);

    const message = await screen.findByTestId("fail-message");
    expect(message).toBeInTheDocument();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/1.0/users/token/invalid",
      expect.objectContaining({}),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Accept-Language": "en",
        }),
      })
    );
  });

  it("sends activation request to backend and handles failure Integration tests", async () => {
    // Spy on the actual API call (without mocking return values)
    const apiSpy = vi.spyOn(fetchApiServiceActivation, "post");

    setup("/activate/invalid", fetchApiServiceActivation);

    // Wait for failure message to appear
    const message = await screen.findByTestId("fail-message");
    expect(message).toBeInTheDocument();

    // Ensure API function was called with the correct URL
    expect(apiSpy).toHaveBeenCalledWith("/api/1.0/users/token/invalid");

    // Check that the API call actually returned an error response
    await expect(apiSpy.mock.results[0].value).rejects.toEqual(
      expect.objectContaining({
        message: "Activation failed",
        languageReceived: "en",
      })
    );
  });

  it("sends activation request after the token changes (first fail, then success, then fail again) Integration tests- MSW", async () => {
    const apiSpy = vi.spyOn(fetchApiServiceActivation, "post");

    // Start with an invalid token (fail case)
    setup("/activate/invalid", fetchApiServiceActivation);

    // Ensure API call was made for the first token
    expect(apiSpy).toHaveBeenCalledWith("/api/1.0/users/token/invalid");

    // Check that the failure message appears
    const failMessages = await screen.findAllByTestId("fail-message");
    expect(failMessages.length).toBeGreaterThan(0);

    // Simulate a new request with a valid token (success case)
    setup("/activate/valid-token", fetchApiServiceActivation);

    // Ensure API call was made for the new token
    expect(apiSpy).toHaveBeenCalledWith("/api/1.0/users/token/valid-token");

    // Check that the success message appears
    const successMessage = await screen.findByTestId("success-message");
    expect(successMessage).toBeInTheDocument();

    // Simulate another request where the same valid token now fails (fail case again)
    setup("/activate/valid-token", fetchApiServiceActivation);

    // Ensure API call was made again for the same token
    expect(apiSpy).toHaveBeenCalledWith("/api/1.0/users/token/valid-token");

    const failMessagesAgain = await screen.findAllByTestId("fail-message");
    expect(failMessagesAgain.length).toBeGreaterThan(0);
  });

  it("displays spinner during activation API call", async () => {
    setup("/activate/5678", fetchApiServiceActivation);

    // Check if the spinner appears initially
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    // Wait for the success messageḍ
    await screen.findByTestId("success-message");

    // Ensure spinner disappears
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("displays spinner during second activation API call to the changed token", async () => {
    setup("/activate/1234", fetchApiServiceActivation);

    // Wait for the spinner to appear
    await screen.findByTestId("loading-spinner");

    // Wait for the success message to confirm activation
    await screen.findByTestId("success-message");

    // Ensure spinner disappears after the first activation
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();

    // Simulate route change by re-rendering with a different token
    setup("/activate/5678", fetchApiServiceActivation);

    await screen.findByTestId("loading-spinner");

    await waitFor(() => {
      screen.findByTestId("fail-message");
    });

    // Ensure the spinner disappears after the second activation attempt
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
});

it("account activation success message styles", async () => {
  setup("/activate/56789", fetchApiServiceActivation);

  // Query the success message by test ID (await the Promise)
  const successMessage = await screen.findByTestId("success-message");

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
  expect(successMessage).toHaveStyleRule("border-radius", "0.25rem"); // Tailwind rounded (default)
});

it("account activation error message styles", async () => {
  setup("/activate/invalid", fetchApiServiceActivation);

  // Query the success message by test ID (await the Promise)
  const errorMessage = await screen.findByTestId("fail-message");

  expect(errorMessage).toBeVisible();

  // Check styles for success message
  expect(errorMessage).toHaveStyleRule(
    "color",
    "rgb(185 28 28 / var(--tw-text-opacity, 1))"
  ); // Tailwind red-700
  expect(errorMessage).toHaveStyleRule(
    "background-color",
    "rgb(254 226 226 / var(--tw-bg-opacity, 1))"
  ); // Tailwind red-100
  expect(errorMessage).toHaveStyleRule("text-align", "center");
  expect(errorMessage).toHaveStyleRule("border-radius", "0.25rem"); // Tailwind rounded (default)
});

it("account activation spinner message styles", async () => {
  setup("/activate/345", fetchApiServiceActivation);

  const spinner = screen.queryByTestId("loading-spinner");
  expect(spinner).toBeInTheDocument();

  expect(spinner).toHaveStyleRule("width", "1.5rem"); // w-6
  expect(spinner).toHaveStyleRule("height", "1.5rem"); // h-6
  expect(spinner).toHaveStyleRule("border-width", "4px"); // border-4
  expect(spinner).toHaveStyleRule(
    "border-color",
    "rgb(59 130 246 / var(--tw-border-opacity, 1))"
  ); // border-blue-500
  expect(spinner).toHaveStyleRule("border-top-color", "transparent"); // border-t-transparent
  expect(spinner).toHaveStyleRule("border-radius", "9999px"); // rounded-full
  expect(spinner).toHaveStyleRule("animation", "spin 1s linear infinite"); // animate-spin
  expect(spinner).toHaveStyleRule("margin-left", "auto"); // mx-auto
  expect(spinner).toHaveStyleRule("margin-right", "auto"); // mx-auto
});
