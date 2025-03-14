import { render, screen, waitFor } from "@testing-library/react";
import UserList from "./UserList";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  axiosApiServiceLoadUserList,
  fetchApiServiceLoadUserList,
} from "../services/apiService";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { server } from "../tests/mocks/server";
import { http, HttpResponse } from "msw";

// Mock axios API call
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.restoreAllMocks(); // Clears all spies/mocks before each test
});

const setup = () => {
  render(<UserList ApiGetService={fetchApiServiceLoadUserList} />);
};

describe("User List", () => {
  it("displays three users in list", async () => {
    setup();
    const users = await screen.findAllByText(/user\d/); // uses a regex to match "user1", "user2", "user3"
    expect(users).toHaveLength(3);
  });
  it("displays next page button", async () => {
    setup();
    await screen.findByText("user1");
    expect(screen.getByTestId("next-button")).toBeInTheDocument();
  });

  it("displays next page after clicking next", async () => {
    setup();
    await screen.findByText("user1");
    userEvent.click(screen.getByTestId("next-button"));
    const firstUserOnPage2 = await screen.findByText("user4");
    expect(firstUserOnPage2).toBeInTheDocument();
  });

  it("Disabled next button on last page", async () => {
    setup();
    await screen.findByText("user1");
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user4");
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user7");
    expect(screen.getByTestId("next-button")).toBeDisabled();
  });

  it("Disabled previous button on first page", async () => {
    setup();
    await screen.findByText("user1");
    expect(screen.getByTestId("prev-button")).toBeDisabled();
  });

  it("displays previous button on second page", async () => {
    setup();
    await screen.findByText("user1");
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user4");
    expect(screen.getByTestId("prev-button")).toBeInTheDocument();
  });

  it("navigates back when clicking previous button", async () => {
    setup();
    await screen.findByText("user1");
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user4");
    userEvent.click(screen.getByTestId("prev-button"));
    const firstUserOnFirstPage = await screen.findByText("user1");
    expect(firstUserOnFirstPage).toBeInTheDocument();
  });

  it('displays "No users found" when the list is empty ( Unit Test for checks component logic)', async () => {
    // Mock API response with an empty user list
    mockedAxios.get.mockResolvedValue({
      data: {
        content: [],
        page: 0,
        size: 3,
        totalPages: 0,
      },
    });

    render(<UserList ApiGetService={axiosApiServiceLoadUserList} />);
    const noUsersMessage = await screen.findByText("No users found");
    expect(noUsersMessage).toBeInTheDocument();
  });

  it('displays "No users found" when the list is empty ( Integration Test for verifies API + Component Integration)', async () => {
    // Override the API response to return an empty list just for this test
    server.use(
      http.get("/api/1.0/users", async () => {
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 3,
          totalPages: 0,
        });
      })
    );

    setup();
    const noUsersMessage = await screen.findByText("No users found");
    expect(noUsersMessage).toBeInTheDocument();
  });

  it("disables and re-enables 'Next' button while loading", async () => {
    render(<UserList ApiGetService={fetchApiServiceLoadUserList} />);

    const nextButton = await screen.findByTestId("next-button");

    // Ensure button is initially enabled
    await waitFor(() => expect(nextButton).not.toBeDisabled());

    // Click Next page
    userEvent.click(nextButton);

    // Wait for the button to become disabled (loading state)
    await waitFor(() => expect(nextButton).toBeDisabled());

    // Wait for next page to load
    await screen.findByText("user4");

    // Ensure button is enabled again
    await waitFor(() => expect(nextButton).not.toBeDisabled());
  });

  it("disables and re-enables 'Previous' button while loading", async () => {
    render(<UserList ApiGetService={fetchApiServiceLoadUserList} />);

    const nextButton = await screen.findByTestId("next-button");
    const prevButton = screen.getByTestId("prev-button");

    // Ensure Previous button is disabled initially (first page)
    expect(prevButton).toBeDisabled();

    // Click Next page
    userEvent.click(nextButton);

    // Wait for the new page to load
    await screen.findByText("user4");

    // Ensure Previous button is now enabled
    await waitFor(() => expect(prevButton).not.toBeDisabled());

    // Click Previous page
    userEvent.click(prevButton);

    // Wait for the button to become disabled (loading state)
    await waitFor(() => expect(prevButton).toBeDisabled());

    // Wait for page 1 to load
    await screen.findByText("user1");

    // Ensure Previous button is disabled again
    await waitFor(() => expect(prevButton).toBeDisabled());
  });
});
