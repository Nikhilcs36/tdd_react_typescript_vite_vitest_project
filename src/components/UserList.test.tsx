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

// Global variable to control mock behavior
let mockIsAdmin = false;

// Mock the authorization hook
vi.mock("../utils/authorization", () => ({
  useUserAuthorization: vi.fn(() => ({
    isAdmin: mockIsAdmin,
  })),
}));

// Mock axios API call
vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

beforeEach(() => {
  vi.restoreAllMocks(); // Clears all spies/mocks before each test
});

const setup = (authenticated = false, isAdmin = false) => {
  // Set the global mock variable
  mockIsAdmin = isAdmin;

  if (authenticated) {
    store.dispatch(
      loginSuccess({
        id: 1,
        username: "testuser",
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        is_staff: isAdmin,
        is_superuser: isAdmin,
      })
    );
  } else {
    store.dispatch(logoutSuccess());
  }

  render(
    <Provider store={store}>
      <MemoryRouter>
        <UserList ApiGetService={fetchApiServiceLoadUserList} />
      </MemoryRouter>
    </Provider>
  );
};

const emptyListAPISetup = () => {
  // Override the API response (in mocks/handlers.ts) to return an empty list just for this test
  server.use(
    http.get(API_ENDPOINTS.GET_USERS, async () => {
      return HttpResponse.json({
        results: [],
        count: 0,
        next: null,
        previous: null,
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
  it("displays login required message when not authenticated", async () => {
    setup(false);
    const loginMessage = await screen.findByText("Please login to view users");
    expect(loginMessage).toBeInTheDocument();
  });

  it("displays three users in list when authenticated", async () => {
    setup(true, true);
    const users = await screen.findAllByText(/user\d/); // uses a regex to match "user1", "user2", "user3"
    expect(users).toHaveLength(3);
  });
  it("displays next page button when authenticated", async () => {
    setup(true, true);
    await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
    expect(screen.getByTestId("next-button")).toBeInTheDocument();
  });

  it("displays next page after clicking next when authenticated", async () => {
    setup(true, true);
    await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
    userEvent.click(screen.getByTestId("next-button"));
    const firstUserOnPage2 = await screen.findByText("user5");
    expect(firstUserOnPage2).toBeInTheDocument();
  });

  it("Disabled next button on last page when authenticated", async () => {
    setup(true, true);
    await screen.findByText("user2"); // user1 is filtered out
    // Go to Page 2
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user5");
    // Now on the last page, the button should be disabled
    expect(screen.getByTestId("next-button")).toBeDisabled();
  });

  it("Disabled previous button on first page when authenticated", async () => {
    setup(true, true);
    await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
    expect(screen.getByTestId("prev-button")).toBeDisabled();
  });

  it("displays previous button on second page when authenticated", async () => {
    setup(true, true);
    await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user5");
    expect(screen.getByTestId("prev-button")).toBeInTheDocument();
  });

  it("navigates back when clicking previous button when authenticated", async () => {
    setup(true, true);
    await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user5");
    userEvent.click(screen.getByTestId("prev-button"));
    await screen.findByText("user2"); // Should navigate back to first page
  });

  it('displays "No users found" when the list is empty ( Unit Test for checks component logic)', async () => {
    // Mock API response with an empty user list (Django format)
    mockedAxios.get.mockResolvedValue({
      data: {
        results: [],
        count: 0,
        next: null,
        previous: null,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <UserList ApiGetService={axiosApiServiceLoadUserList} />
        </MemoryRouter>
      </Provider>
    );
    const noUsersMessage = await screen.findByText("No users found");
    expect(noUsersMessage).toBeInTheDocument();
  });

  it('displays "No users found" when the list is empty ( Integration Test for verifies API + Component Integration)', async () => {
    server.use(
      http.get(API_ENDPOINTS.GET_USERS, async () => {
        return HttpResponse.json({
          results: [],
          count: 0,
          next: null,
          previous: null,
        });
      })
    );
    setup(true, true);
    const noUsersMessage = await screen.findByText("No users found");
    expect(noUsersMessage).toBeInTheDocument();
  });

  it("disables and re-enables 'Next' button while loading", async () => {
    server.use(
      createUserListHandler({
        delayPage: 2, // Only delay page 2 requests
        delayMs: 500,
      })
    );

    setup(true, true);

    const nextButton = await screen.findByTestId("next-button");

    // Ensure button is initially enabled
    await waitFor(() => expect(nextButton).not.toBeDisabled());

    // Click Next page
    userEvent.click(nextButton);

    // Wait for the button to become disabled (loading state)
    await waitFor(() => expect(nextButton).toBeDisabled());

    // Wait for next page to load
    await screen.findByText("user5");

    // Ensure button is enabled again
    await waitFor(() => expect(nextButton).not.toBeDisabled());
  });

  it("disables and re-enables 'Previous' button while loading", async () => {
    setup(true, true);

    const nextButton = await screen.findByTestId("next-button");
    const prevButton = screen.getByTestId("prev-button");

    // Ensure Previous button is disabled initially (first page)
    expect(prevButton).toBeDisabled();

    // Click Next page
    userEvent.click(nextButton);

    // Wait for the new page to load
    await screen.findByText("user5");

    // Ensure Previous button is now enabled
    await waitFor(() => expect(prevButton).not.toBeDisabled());

    // Click Previous page
    userEvent.click(prevButton);

    // Wait for the button to become disabled (loading state)
    await waitFor(() => expect(prevButton).toBeDisabled());

    // Wait for page 1 to load
    await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion

    // Ensure Previous button is disabled again
    await waitFor(() => expect(prevButton).toBeDisabled());
  });

  it("applies correct styles when buttons are enabled and disabled", async () => {
    server.use(
      createUserListHandler({
        delayPage: 2, // Only delay page 2 requests
        delayMs: 500,
      })
    );

    setup(true, true);

    const nextButton = await screen.findByTestId("next-button");
    const prevButton = screen.getByTestId("prev-button");

    //Initial State: Next enabled, Previous disabled
    await expectEnabled(nextButton);
    await expectDisabled(prevButton);

    // Click 'Next' - Next should become disabled during loading
    userEvent.click(nextButton);
    await waitFor(() => expectDisabled(nextButton));

    // Wait for next page - Previous should become enabled
    await screen.findByText("user5");
    await expectEnabled(prevButton);

    // Click 'Previous' - Previous should become disabled during loading
    userEvent.click(prevButton);
    await waitFor(() => expectDisabled(prevButton));

    // Wait for page 1 - Next enabled again
    await screen.findByText("user2");
    await expectEnabled(nextButton);
  });

  it("navigates to the correct user ID when clicking a user (Check Rendered UserPage)", async () => {
    const UserPageMock = () => {
      const { id } = useParams(); // Get the ID from the URL
      return <p>{id}</p>;
    };

    // Simulate a real page transition using MemoryRouter and Routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <UserListWithRouter
                  ApiGetService={fetchApiServiceLoadUserList}
                />
              }
            />
            <Route path="/user/:id" element={<UserPageMock />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Wait for user2 to appear (user1 is filtered out due to authenticated user exclusion)
    await screen.findByText("user2");

    // Click on user2
    userEvent.click(screen.getByText("user2"));

    // Verify correct user ID is displayed on the new page url
    expect(await screen.findByText("2")).toBeInTheDocument();
  });

  it("renders default profile image and user profile image", async () => {
    setup(true, true);

    // Ensure users are loaded first - user1 is excluded as authenticated user, so look for user2
    await screen.findByText("user2");

    // Get all profile images
    const profileImages = screen.getAllByAltText(
      "Profile"
    ) as HTMLImageElement[];

    // Check that we have 3 images (since we load 3 users per page, but user1 is excluded)
    expect(profileImages).toHaveLength(3);

    // Ensure user2 (has image) uses its actual image URL
    expect(profileImages[0].src).toBe("https://test.com/user1.jpg");

    // Ensure user3 (no image) uses default
    expect(profileImages[1].src).toContain(defaultProfileImage);

    // Ensure user4 (no image) uses default
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
        setup(true, true);
        await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
        expect(screen.getByText("User List")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
      });

      it("renders userlist emptyPageMessage in English by default", async () => {
        emptyListAPISetup();
        setup(true, true);
        const noUsersMessage = await screen.findByText("No users found");
        expect(noUsersMessage).toBeInTheDocument();
      });
    });

    describe("Language Change for userlist", () => {
      it("renders userlist in Malayalam when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ml");
        });
        setup(true, true);
        await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
        expect(screen.getByText("ഉപയോക്തൃ പട്ടിക")).toBeInTheDocument();
        expect(screen.getByText("അടുത്തത്")).toBeInTheDocument();
        expect(screen.getByText("മുമ്പത്തേത്")).toBeInTheDocument();
      });

      it("renders userlist emptyPageMessage in Malayalam when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ml");
        });
        emptyListAPISetup();
        setup(true, true);
        const noUsersMessage = await screen.findByText(
          "ഉപയോക്താക്കളെയൊന്നും കണ്ടെത്തിയില്ല"
        );
        expect(noUsersMessage).toBeInTheDocument();
      });

      it("renders userlist in Arabic when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ar");
        });
        setup(true, true);
        await screen.findByText("user2"); // user1 is filtered out due to authenticated user exclusion
        expect(screen.getByText("قائمة المستخدمين")).toBeInTheDocument();
        expect(screen.getByText("التالي")).toBeInTheDocument();
        expect(screen.getByText("السابق")).toBeInTheDocument();
      });

      it("renders userlist emptyPageMessage in Arabic when language is changed", async () => {
        await act(async () => {
          await i18n.changeLanguage("ar");
        });
        emptyListAPISetup();
        setup(true, true);
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
              delayPage: 2, // Only delay page 2 requests
              delayMs: 500,
            })
          );

          setup(true, true);

          // Initial page load
          await screen.findByText("user2");
          const nextButton = screen.getByTestId("next-button");

          userEvent.click(nextButton);

          // Verify loading states
          await expectDisabled(nextButton);
          await waitFor(
            () => expect(screen.getByTestId("spinner")).toBeInTheDocument(),
            { timeout: 500 }
          );

          // Verify new page
          await screen.findByText("user5");
          await expectEnabled(nextButton);
        });

        it("does not show spinner when API completes quickly", async () => {
          server.use(
            createUserListHandler({
              delayPage: 2,
              delayMs: 100, // Shorter than spinner threshold
            })
          );

          setup(true, true);

          await screen.findByText("user2");
          const nextButton = screen.getByTestId("next-button");

          userEvent.click(nextButton);
          await screen.findByText("user5");

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
              delayPage: 2,
              delayMs: 500, // Total API delay
            })
          );

          setup(true, true);

          // Initial page load
          await screen.findByText("user2");
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
          await screen.findByText("user5");

          // Final state check
          await expectEnabled(nextButton);
          expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
        });

        it("never disables buttons when API completes faster than 300ms", async () => {
          server.use(
            createUserListHandler({
              delayPage: 2,
              delayMs: 250, // Faster than button disable delay
            })
          );

          setup(true, true);

          await screen.findByText("user2");
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
          await screen.findByText("user5");
          await expectEnabled(nextButton);
        });
      });
    });
  });

  describe("Authorization Headers", () => {
    it("should include Authorization header when user is authenticated (axios)", async () => {
      setup(true, true); // Use the setup function for authenticated admin state

      // Mock axios to capture the request
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ id: 1, username: "user1", email: "user1@example.com" }],
          count: 1,
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

      // Verify axios was called with Authorization header and Django pagination params
      expect(mockedAxios.get).toHaveBeenCalledWith(
        API_ENDPOINTS.GET_USERS,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "JWT mock-access-token",
            "Accept-Language": expect.any(String),
          }),
          params: expect.objectContaining({
            page: 1,
            page_size: 3,
          }),
        })
      );
    });

    it("should include Authorization header when user is authenticated (fetch)", async () => {
      setup(true, true); // Use the setup function for authenticated admin state

      // Setup MSW handler to capture authorization header
      let capturedAuthHeader: string | null = null;
      let capturedLanguageHeader: string | null = null;
      server.use(
        http.get(API_ENDPOINTS.GET_USERS, async ({ request }) => {
          capturedAuthHeader = request.headers.get("Authorization");
          capturedLanguageHeader = request.headers.get("Accept-Language");
          return HttpResponse.json({
            results: [{ id: 2, username: "user2", email: "user2@example.com" }],
            count: 1,
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

      await screen.findByText("user2");

      // Verify Authorization header was sent
      expect(capturedAuthHeader).toBe("JWT mock-access-token");
      expect(capturedLanguageHeader).toBeDefined();
    });

    it("should not include Authorization header when user is not authenticated (axios)", async () => {
      // Ensure user is not authenticated
      store.dispatch(logoutSuccess());

      // Mock axios to capture any potential requests
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ id: 1, username: "user1", email: "user1@example.com" }],
          count: 1,
        },
      });

      // Render with axios service
      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={axiosApiServiceLoadUserList} />
          </MemoryRouter>
        </Provider>
      );

      // Verify that the login message is displayed (no API call should be made)
      await screen.findByText("Please login to view users");

      // Verify axios was NOT called when user is not authenticated
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should not include Authorization header when user is not authenticated (fetch)", async () => {
      // Ensure user is not authenticated by explicitly calling logout
      store.dispatch(logoutSuccess());

      // Setup MSW handler to capture headers
      let capturedAuthHeader: string | null = null;
      let capturedLanguageHeader: string | null = null;
      server.use(
        http.get(API_ENDPOINTS.GET_USERS, async ({ request }) => {
          capturedAuthHeader = request.headers.get("Authorization");
          capturedLanguageHeader = request.headers.get("Accept-Language");
          return HttpResponse.json({
            results: [{ id: 1, username: "user1", email: "user1@example.com" }],
            count: 1,
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

      // Verify that the login message is displayed
      await screen.findByText("Please login to view users");

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
          access: "mock-access-token",
          refresh: "mock-refresh-token",
          is_staff: false,
          is_superuser: false,
        })
      );

      // Mock axios to return filtered user list (excluding user2)
      mockedAxios.get.mockResolvedValue({
        data: {
          results: [
            { id: 1, username: "user1", email: "user1@example.com" },
            { id: 3, username: "user3", email: "user3@example.com" },
            { id: 4, username: "user4", email: "user4@example.com" },
          ],
          count: 3,
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
          access: "mock-access-token",
          refresh: "mock-refresh-token",
          is_staff: false,
          is_superuser: false,
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

    it("should show login message when not authenticated (fetch/MSW)", async () => {
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

      // Verify login message is displayed instead of user list
      expect(
        screen.getByText("Please login to view users")
      ).toBeInTheDocument();

      // Verify no users are displayed when not authenticated
      expect(screen.queryByText("user1")).not.toBeInTheDocument();
      expect(screen.queryByText("user2")).not.toBeInTheDocument();
      expect(screen.queryByText("user3")).not.toBeInTheDocument();
    });

    it("should handle case when authenticated user is not in the current page", async () => {
      // Setup authenticated user with ID 999 (not in mock data)
      store.dispatch(
        loginSuccess({
          id: 999,
          username: "authenticateduser",
          access: "mock-access-token",
          refresh: "mock-refresh-token",
          is_staff: false,
          is_superuser: false,
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
      // Setup admin user first
      setup(true, true);

      // Mock API to track calls
      const mockGet = vi.fn();
      mockGet
        .mockResolvedValueOnce({
          results: [
            { id: 1, username: "user1", email: "user1@mail.com", image: null },
            { id: 3, username: "user3", email: "user3@mail.com", image: null },
            { id: 4, username: "user4", email: "user4@mail.com", image: null },
          ],
          count: 3,
        })
        .mockResolvedValueOnce({
          results: [
            { id: 1, username: "user1", email: "user1@mail.com", image: null },
            { id: 2, username: "user2", email: "user2@mail.com", image: null }, // user2 now appears after logoutSuccess
            { id: 3, username: "user3", email: "user3@mail.com", image: null },
          ],
          count: 3,
        });

      const mockApiService = { get: mockGet };

      render(
        <Provider store={store}>
          <MemoryRouter>
            <UserList ApiGetService={mockApiService} />
          </MemoryRouter>
        </Provider>
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

  describe("API Response Structure", () => {
    it("displays users from API response with 'results' field", async () => {
      server.use(
        http.get(API_ENDPOINTS.GET_USERS, async () => {
          return HttpResponse.json({
            count: 3,
            next: null,
            previous: null,
            results: [
              { id: 2, username: "user2", email: "user2@mail.com" },
              { id: 3, username: "user3", email: "user3@mail.com" },
              { id: 4, username: "user4", email: "user4@mail.com" },
            ],
          });
        })
      );

      setup(true, true);

      expect(await screen.findByText("user2")).toBeInTheDocument();
      expect(await screen.findByText("user3")).toBeInTheDocument();
      expect(await screen.findByText("user4")).toBeInTheDocument();
    });
  });

  describe("Admin Access Controls", () => {
    beforeEach(() => {
      // Reset auth state before each test
      store.dispatch(logoutSuccess());
    });

    it("displays user list when authenticated user is admin", async () => {
      setup(true, true); // authenticated = true, isAdmin = true
      const users = await screen.findAllByText(/user\d/);
      expect(users).toHaveLength(3);
      expect(screen.getByText("User List")).toBeInTheDocument();
    });

    it("displays access denied message when authenticated user is not admin", async () => {
      setup(true, false); // authenticated = true, isAdmin = false
      const accessDeniedMessage = await screen.findByText("Access Denied");
      expect(accessDeniedMessage).toBeInTheDocument();
      expect(screen.getByText("You need administrator privileges to view the user list.")).toBeInTheDocument();
    });

    it("displays translated access denied message when authenticated user is not admin", async () => {
      // Change language to Malayalam
      act(() => {
        i18n.changeLanguage("ml");
      });

      setup(true, false); // authenticated = true, isAdmin = false

      const accessDeniedTitle = await screen.findByText("അക്സസ് നിഷേധിച്ചു");
      expect(accessDeniedTitle).toBeInTheDocument();
      expect(screen.getByText("ഉപയോക്തൃ പട്ടിക കാണാൻ നിങ്ങൾക്ക് അഡ്മിനിസ്ട്രേറ്റർ അനുമതികൾ ആവശ്യമാണ്.")).toBeInTheDocument();

      // Reset language back to English for other tests
      act(() => {
        i18n.changeLanguage("en");
      });
    });

    it("displays Arabic access denied message when authenticated user is not admin", async () => {
      // Change language to Arabic
      act(() => {
        i18n.changeLanguage("ar");
      });

      setup(true, false); // authenticated = true, isAdmin = false

      const accessDeniedTitle = await screen.findByText("تم رفض الوصول");
      expect(accessDeniedTitle).toBeInTheDocument();
      expect(screen.getByText("تحتاج إلى صلاحيات المسؤول لعرض قائمة المستخدمين.")).toBeInTheDocument();

      // Reset language back to English for other tests
      act(() => {
        i18n.changeLanguage("en");
      });
    });



    it("shows login required message when not authenticated (takes precedence over admin check)", async () => {
      setup(false, false); // authenticated = false, isAdmin = false
      const loginMessage = await screen.findByText("Please login to view users");
      expect(loginMessage).toBeInTheDocument();
      expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
    });
  });
});
