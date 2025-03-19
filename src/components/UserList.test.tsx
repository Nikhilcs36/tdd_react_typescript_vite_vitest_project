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
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import UserListWithRouter from "./UserList";

// Mock axios API call
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.restoreAllMocks(); // Clears all spies/mocks before each test
});

const setup = () => {
  render(
    <MemoryRouter>
      <UserList ApiGetService={fetchApiServiceLoadUserList} />
    </MemoryRouter>
  );
};

// Helper functions for checking button styles
const expectEnabled = (button: HTMLElement) => {
  expect(button).not.toBeDisabled();
  expect(button).toHaveStyleRule(
    "background-color",
    "rgb(59 130 246 / var(--tw-bg-opacity, 1))"
  ); // Tailwind blue-500
};

const expectDisabled = (button: HTMLElement) => {
  expect(button).toBeDisabled();
  // Wait a short time before checking disabled styles to avoid testing during transition
  waitFor(
    () =>
      expect(button).toHaveStyleRule(
        "background-color",
        "rgb(209 213 219 / var(--tw-bg-opacity, 1))"
      ) // Tailwind gray-300
  );
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

    render(
      <MemoryRouter>
        <UserList ApiGetService={axiosApiServiceLoadUserList} />
      </MemoryRouter>
    );
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
    setup();

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
    setup();

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

  it("applies correct styles when buttons are enabled and disabled", async () => {
    setup();

    const nextButton = await screen.findByTestId("next-button");
    const prevButton = screen.getByTestId("prev-button");

    //Initial State: Next enabled, Previous disabled
    expectEnabled(nextButton);
    expectDisabled(prevButton);

    // Click 'Next' - Next should become disabled during loading
    userEvent.click(nextButton);
    await waitFor(() => expectDisabled(nextButton));

    // Wait for next page - Previous should become enabled
    await screen.findByText("user4");
    await waitFor(() => expectEnabled(prevButton));

    // Click 'Previous' - Previous should become disabled during loading
    userEvent.click(prevButton);
    await waitFor(() => expectDisabled(prevButton));

    // Wait for page 1 - Next enabled again
    await screen.findByText("user1");
    await waitFor(() => expectEnabled(nextButton));
  });

  it("navigates to the correct user ID when clicking a user (Check Rendered Page)", async () => {
    const UserPageMock = () => {
      const { id } = useParams(); // Get the ID from the URL
      return <p>{id}</p>;
    };

    // Simulate a real page transition using MemoryRouter and Routes
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <UserListWithRouter ApiGetService={fetchApiServiceLoadUserList} />
            }
          />
          <Route path="/user/:id" element={<UserPageMock />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("user1");

    // Click on user1
    userEvent.click(screen.getByText("user1"));

    // Verify correct user ID is displayed on the new page url
    expect(await screen.findByText("1")).toBeInTheDocument();
  });
});
