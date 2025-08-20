import { act, render, screen, waitFor } from "@testing-library/react";
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
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import UserListWithRouter from "./UserList";
import defaultProfileImage from "../assets/profile.png";
import i18n from "../locale/i18n";
import { createUserListHandler } from "../tests/testUtils";
import { Provider } from "react-redux";
import store from "../store";
import { loginSuccess } from "../store/actions";
import { logoutSuccess } from "../store/actions";

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

const emptyListAPISetup = () => {
  // Override the API response (in mocks/handlers.ts) to return an empty list just for this test
  server.use(
    http.get(API_ENDPOINTS.GET_USERS, async () => {
      return HttpResponse.json({
        content: [],
        page: 0,
        size: 3,
        totalPages: 0,
      });
    })
  );
};

// Helper functions for checking button styles
const expectEnabled = async (button: HTMLElement) => {
  await waitFor(
    () => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveStyle({ backgroundColor: "rgb(59 130 246)" }); // Tailwind blue-500
    },
    { timeout: 1000 }
  );
};

const expectDisabled = async (button: HTMLElement) => {
  await waitFor(
    () => {
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({ backgroundColor: "rgb(209 213 219)" }); // Tailwind gray-300
    },
    { timeout: 1000 }
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
    emptyListAPISetup();
    setup();
    const noUsersMessage = await screen.findByText("No users found");
    expect(noUsersMessage).toBeInTheDocument();
  });

  it("disables and re-enables 'Next' button while loading", async () => {
    server.use(
      createUserListHandler({
        delayPage: 1, // Only delay page 1 requests
        delayMs: 500,
      })
    );

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
    server.use(
      createUserListHandler({
        delayPage: 1, // Only delay page 1 requests
        delayMs: 500,
      })
    );

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

  it("navigates to the correct user ID when clicking a user (Check Rendered UserPage)", async () => {
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

  it("renders default profile image and user profile image", async () => {
    setup();

    // Ensure users are loaded first
    await screen.findByText("user1");

    // Get all profile images
    const profileImages = screen.getAllByAltText(
      "Profile"
    ) as HTMLImageElement[];

    // Check that we have at least 3 images (since we load 3 users per page)
    expect(profileImages.length).toBeGreaterThanOrEqual(3);

    // Ensure user1 (no image) uses default
    expect(profileImages[0].src).toContain(defaultProfileImage);

    // Ensure user2 (has image) uses its actual image URL
    expect(profileImages[1].src).toBe("https://test.com/user1.jpg");

    // Ensure user3 (no image) uses default
    expect(profileImages[2].src).toContain(defaultProfileImage);
  });

  describe("i18n Integration for Userlist and LanguageSwitcher", () => {
    beforeEach(() => {
      // Reset language to default ('en') before each test.
      act(() => {
        i18n.changeLanguage("en");
      });
    });

    // Default Language Tests
    describe("Default Language", () => {
      it("renders userlist in English by default", async () => {
        setup();
        await screen.findByText("user1");
        expect(screen.getByText("User List")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
      });

      it("renders userlist emptyPageMessage in English by default", async () => {
        emptyListAPISetup();
        setup();
        const noUsersMessage = await screen.findByText("No users found");
        expect(noUsersMessage).toBeInTheDocument();
      });
    });

    describe("Language Change for userlist", () => {
      it("renders userlist in Malayalam when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ml");
        });
        setup();
        await screen.findByText("user1");
        expect(screen.getByText("ഉപയോക്തൃ പട്ടിക")).toBeInTheDocument();
        expect(screen.getByText("അടുത്തത്")).toBeInTheDocument();
        expect(screen.getByText("മുമ്പത്തേത്")).toBeInTheDocument();
      });

      it("renders userlist emptyPageMessage in Malayalam when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ml");
        });
        emptyListAPISetup();
        setup();
        const noUsersMessage = await screen.findByText(
          "ഉപയോക്താക്കളെയൊന്നും കണ്ടെത്തിയില്ല"
        );
        expect(noUsersMessage).toBeInTheDocument();
      });

      it("renders userlist in Arabic when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ar");
        });
        setup();
        await screen.findByText("user1");
        expect(screen.getByText("قائمة المستخدمين")).toBeInTheDocument();
        expect(screen.getByText("التالي")).toBeInTheDocument();
        expect(screen.getByText("السابق")).toBeInTheDocument();
      });

      it("renders userlist emptyPageMessage in Arabic when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ar");
        });
        emptyListAPISetup();
        setup();
        const noUsersMessage = await screen.findByText(
          "لم يتم العثور على أي مستخدمين"
        );
        expect(noUsersMessage).toBeInTheDocument();
      });

      describe("Spinner and Loading States", () => {
        beforeEach(() => {
          server.resetHandlers();
        });

        it("shows spinner after 300ms delay when API is slow", async () => {
          server.use(
            createUserListHandler({
              delayPage: 1, // Only delay page 1 requests
              delayMs: 500,
            })
          );

          setup();

          // Initial page load
          await screen.findByText("user1");
          const nextButton = screen.getByTestId("next-button");

          userEvent.click(nextButton);

          // Verify loading states
          await expectDisabled(nextButton);
          await waitFor(
            () => expect(screen.getByTestId("spinner")).toBeInTheDocument(),
            { timeout: 500 }
          );

          // Verify new page
          await screen.findByText("user4");
          await expectEnabled(nextButton);
        });

        it("does not show spinner when API completes quickly", async () => {
          server.use(
            createUserListHandler({
              delayPage: 1,
              delayMs: 100, // Shorter than spinner threshold
            })
          );

          setup();

          await screen.findByText("user1");
          const nextButton = screen.getByTestId("next-button");

          userEvent.click(nextButton);
          await screen.findByText("user4");

          expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
          await expectEnabled(nextButton);
        });
      });

      describe("Delay Button Disabled States", () => {
        beforeEach(() => {
          server.resetHandlers();
        });

        it("disables buttons after 300ms delay on slow network but keeps enabled before delay", async () => {
          server.use(
            createUserListHandler({
              delayPage: 1,
              delayMs: 500, // Total API delay
            })
          );

          setup();

          // Initial page load
          await screen.findByText("user1");
          const nextButton = screen.getByTestId("next-button");

          // Initial state check
          await expectEnabled(nextButton);

          // Trigger page change
          userEvent.click(nextButton);

          // Immediate check (before 300ms delay)
          await waitFor(
            () => {
              expect(nextButton).not.toBeDisabled();
              expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
            },
            { timeout: 250 }
          );

          // After 300ms delay
          await waitFor(
            () => {
              expect(nextButton).toBeDisabled();
              expect(screen.getByTestId("spinner")).toBeInTheDocument();
            },
            { timeout: 350 }
          );

          // After API completes (500ms total)
          await screen.findByText("user4");

          // Final state check
          await expectEnabled(nextButton);
          expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
        });

        it("never disables buttons when API completes faster than 300ms", async () => {
          server.use(
            createUserListHandler({
              delayPage: 1,
              delayMs: 250, // Faster than button disable delay
            })
          );

          setup();

          await screen.findByText("user1");
          const nextButton = screen.getByTestId("next-button");

          userEvent.click(nextButton);

          // Check during API request
          await waitFor(
            () => {
              expect(nextButton).not.toBeDisabled();
            },
            { timeout: 280 }
          );

          // After API completes
          await screen.findByText("user4");
          await expectEnabled(nextButton);
        });
      });
    });
  });

  describe("Authorization Headers", () => {
    beforeEach(() => {
      // Reset auth state before each test
      store.dispatch(logoutSuccess());
    });

    it("should include Authorization header when user is authenticated (axios)", async () => {
      // Setup authenticated user on the default store
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          token: "test-jwt-token",
        })
      );

      // Mock axios to capture the request
      mockedAxios.get.mockResolvedValue({
        data: {
          content: [{ id: 1, username: "user1", email: "user1@example.com" }],
          page: 0,
          size: 3,
          totalPages: 1,
        },
      });

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={axiosApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      await screen.findByText("user1");

      // Verify axios was called with Authorization header
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.GET_USERS}?page=0&size=3`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt-token",
            "Accept-Language": expect.any(String),
          }),
        })
      );
    });

    it("should include Authorization header when user is authenticated (fetch)", async () => {
      // Setup authenticated user on the default store
      store.dispatch(
        loginSuccess({
          id: 1,
          username: "testuser",
          token: "test-jwt-token",
        })
      );

      // Setup MSW handler to capture authorization header
      let capturedAuthHeader: string | null = null;
      let capturedLanguageHeader: string | null = null;
      server.use(
        http.get(API_ENDPOINTS.GET_USERS, async ({ request }) => {
          capturedAuthHeader = request.headers.get("Authorization");
          capturedLanguageHeader = request.headers.get("Accept-Language");
          return HttpResponse.json({
            content: [{ id: 1, username: "user1", email: "user1@example.com" }],
            page: 0,
            size: 3,
            totalPages: 1,
          });
        })
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={fetchApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      await screen.findByText("user1");

      // Verify Authorization header was sent
      expect(capturedAuthHeader).toBe("Bearer test-jwt-token");
      expect(capturedLanguageHeader).toBeDefined();
    });

    it("should not include Authorization header when user is not authenticated (axios)", async () => {
      // No authentication setup - user remains unauthenticated (logoutSuccess already called in beforeEach)

      mockedAxios.get.mockResolvedValue({
        data: {
          content: [{ id: 1, username: "user1", email: "user1@example.com" }],
          page: 0,
          size: 3,
          totalPages: 1,
        },
      });

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={axiosApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      await screen.findByText("user1");

      // Verify axios was called without Authorization header
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.GET_USERS}?page=0&size=3`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept-Language": expect.any(String),
          }),
        })
      );

      // Verify Authorization header is not present
      const callArgs = mockedAxios.get.mock.calls[0];
      const headers = callArgs[1]?.headers;
      expect(headers).not.toHaveProperty("Authorization");
    });

    it("should not include Authorization header when user is not authenticated (fetch)", async () => {
      // No authentication setup - user remains unauthenticated (logoutSuccess already called in beforeEach)

      // Setup MSW handler to capture headers
      let capturedAuthHeader: string | null = null;
      let capturedLanguageHeader: string | null = null;
      server.use(
        http.get(API_ENDPOINTS.GET_USERS, async ({ request }) => {
          capturedAuthHeader = request.headers.get("Authorization");
          capturedLanguageHeader = request.headers.get("Accept-Language");
          return HttpResponse.json({
            content: [{ id: 1, username: "user1", email: "user1@example.com" }],
            page: 0,
            size: 3,
            totalPages: 1,
          });
        })
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={fetchApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      await screen.findByText("user1");

      // Verify Authorization header was not sent
      expect(capturedAuthHeader).toBeNull();
      expect(capturedLanguageHeader).toBeDefined();
    });
  });

  describe("Authenticated User Exclusion", () => {
    beforeEach(() => {
      // Reset auth state before each test
      store.dispatch(logoutSuccess());
    });

    it("should exclude authenticated user from user list (axios)", async () => {
      // Setup authenticated user with ID 2 (user2 from mock data)
      store.dispatch(
        loginSuccess({
          id: 2,
          username: "user2",
          token: "test-jwt-token",
        })
      );

      // Mock axios to return filtered user list (excluding user2)
      mockedAxios.get.mockResolvedValue({
        data: {
          content: [
            { id: 1, username: "user1", email: "user1@example.com" },
            { id: 3, username: "user3", email: "user3@example.com" },
            { id: 4, username: "user4", email: "user4@example.com" },
          ],
          page: 0,
          size: 3,
          totalPages: 2, // Adjusted for filtered list
        },
      });

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={axiosApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      // Verify user2 (authenticated user) is not displayed
      expect(screen.queryByText("user2")).not.toBeInTheDocument();

      // Verify other users are displayed
      await screen.findByText("user1");
      expect(screen.getByText("user3")).toBeInTheDocument();
      expect(screen.getByText("user4")).toBeInTheDocument();
    });

    it("should exclude authenticated user from user list (fetch/MSW)", async () => {
      // Setup authenticated user with ID 2 (user2 from mock data)
      store.dispatch(
        loginSuccess({
          id: 2,
          username: "user2",
          token: "test-jwt-token",
        })
      );

      // The MSW handler should automatically filter out the authenticated user
      // based on the Authorization header containing user info

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={fetchApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Verify user2 (authenticated user) is not displayed
      expect(screen.queryByText("user2")).not.toBeInTheDocument();

      // Verify other users are displayed
      expect(screen.getByText("user1")).toBeInTheDocument();
      expect(screen.getByText("user3")).toBeInTheDocument();
    });

    it("should show all users when not authenticated (fetch/MSW)", async () => {
      // No authentication setup - user remains unauthenticated

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={fetchApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Verify all users are displayed including user2
      expect(screen.getByText("user1")).toBeInTheDocument();
      expect(screen.getByText("user2")).toBeInTheDocument();
      expect(screen.getByText("user3")).toBeInTheDocument();
    });

    it("should handle case when authenticated user is not in the current page", async () => {
      // Setup authenticated user with ID 999 (not in mock data)
      store.dispatch(
        loginSuccess({
          id: 999,
          username: "authenticateduser",
          token: "test-jwt-token",
        })
      );

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={fetchApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      });

      // Verify all mock users are displayed (since authenticated user ID 999 is not in the list)
      expect(screen.getByText("user1")).toBeInTheDocument();
      expect(screen.getByText("user2")).toBeInTheDocument();
      expect(screen.getByText("user3")).toBeInTheDocument();
    });
  });

  describe("User List Refresh Event", () => {
    it("should refresh user list when userListRefresh event is dispatched", async () => {
      // Mock API to track calls
      const mockGet = vi.fn();
      mockGet
        .mockResolvedValueOnce({
          content: [
            { id: 1, username: "user1", email: "user1@mail.com", image: null },
            { id: 3, username: "user3", email: "user3@mail.com", image: null },
            { id: 4, username: "user4", email: "user4@mail.com", image: null },
          ],
          page: 0,
          size: 3,
          totalPages: 1,
        })
        .mockResolvedValueOnce({
          content: [
            { id: 1, username: "user1", email: "user1@mail.com", image: null },
            { id: 2, username: "user2", email: "user2@mail.com", image: null }, // user2 now appears after logoutSuccess
            { id: 3, username: "user3", email: "user3@mail.com", image: null },
          ],
          page: 0,
          size: 3,
          totalPages: 1,
        });

      const mockApiService = { get: mockGet };

      render(
        <MemoryRouter>
          <UserList ApiGetService={mockApiService} />
        </MemoryRouter>
      );

      // Wait for initial load
      await screen.findByText("user1");
      expect(mockGet).toHaveBeenCalledTimes(1);

      // Dispatch the custom event to trigger refresh
      act(() => {
        const refreshEvent = new CustomEvent("userListRefresh");
        window.dispatchEvent(refreshEvent);
      });

      // Wait for the refresh to complete and verify user2 now appears
      await screen.findByText("user2");
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});
