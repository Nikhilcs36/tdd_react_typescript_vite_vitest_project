import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "../store";
import { Provider } from "react-redux";
import { ProfilePageWrapper } from "./ProfilePage";
import { loginSuccess } from "../store/actions";
import i18n from "../locale/i18n";
import { API_ENDPOINTS } from "../services/apiEndpoints";

// Mock the store module
let store: ReturnType<typeof createStore>;
vi.mock("../store", async () => {
  const actual = await vi.importActual<typeof import("../store")>("../store");
  return {
    ...actual,
    default: {
      getState: () => store.getState(),
      dispatch: (action: any) => store.dispatch(action),
      subscribe: (listener: () => void) => store.subscribe(listener),
    },
  };
});

// Mock API services
const mockApiGetService = { get: vi.fn() };
const mockApiPutService = { put: vi.fn() };
const mockApiDeleteService = { delete: vi.fn() };

describe("ProfilePage", () => {
  const baseUser = {
    id: 1,
    username: "user1",
    email: "user1@example.com",
    image: "https://example.com/image.jpg",
  };

  // Unified setup function
  const setup = async (options = {}) => {
    const opts = options as any;
    const {
      language = "en",
      initialEntries = ["/profile"],
      userData = baseUser,
      mockGet = mockApiGetService.get.mockResolvedValue(userData),
      mockPut = mockApiPutService.put,
      mockDelete = mockApiDeleteService.delete,
      withAuth = false,
    } = opts;

    await act(async () => {
      await i18n.changeLanguage(language);
    });

    if (withAuth) {
      await act(async () => {
        store.dispatch(
          loginSuccess({
            id: 1,
            username: "authedUser",
            access: "test-access-token",
            refresh: "test-refresh-token",
          })
        );
      });
    }

    let renderResult;
    await act(async () => {
      renderResult = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={initialEntries}>
            <ProfilePageWrapper
              ApiGetService={{ get: mockGet }}
              ApiPutService={{ put: mockPut }}
              ApiDeleteService={{ delete: mockDelete }}
            />
          </MemoryRouter>
        </Provider>
      );
    });

    return {
      ...(renderResult || {}),
      userData,
      mockGet,
      mockPut,
      mockDelete,
    };
  };

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
    mockApiGetService.get.mockResolvedValue(baseUser);
    mockApiPutService.put.mockResolvedValue({
      ...baseUser,
      username: "updatedUser",
    });
    mockApiDeleteService.delete.mockResolvedValue({}); // Reset delete mock
  });

  afterEach(cleanup);

  describe("Core Functionality", () => {
    it("displays user name when found", async () => {
      await setup();
      await waitFor(() =>
        expect(screen.getByTestId("username")).toHaveTextContent("user1")
      );
    });

    it("uses ME endpoint for fetching user data", async () => {
      const { mockGet } = await setup();

      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      expect(mockGet).toHaveBeenCalledWith(API_ENDPOINTS.ME);
    });

    it("preserves auth token during updates", async () => {
      const { mockPut } = await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("edit-profile-button"));
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => expect(mockPut).toHaveBeenCalled());
      expect(store.getState().auth.accessToken).toBe("test-access-token");
      expect(store.getState().auth.refreshToken).toBe("test-refresh-token");
      expect(mockPut).toHaveBeenCalledWith(
        API_ENDPOINTS.ME, // Should use ME endpoint for updates
        expect.objectContaining({
          username: "updateduser",
        })
      );
    });

    it("displays loading spinner", async () => {
      const delayedResolve = () =>
        new Promise((resolve) => setTimeout(() => resolve(baseUser), 200));

      await setup({ mockGet: vi.fn().mockImplementation(delayedResolve) });
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument()
      );
    });

    it("handles user not found", async () => {
      const mockError = vi.fn().mockRejectedValue({
        response: { data: { message: "User not found" } },
      });

      await setup({
        mockGet: mockError,
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("error-message")).toHaveTextContent(
            "User not found"
          );
        },
        { timeout: 3000 }
      );
    });

    it("handles update errors", async () => {
      await setup();

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Mock the update to fail
      mockApiPutService.put.mockRejectedValueOnce({
        response: { data: { message: "Update failed" } },
      });

      // Make a change and submit the form
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Update failed"
        );
      });
    });
  });

  describe("Profile Image Handling", () => {
    it("shows default image when none provided", async () => {
      await setup({ userData: { ...baseUser, image: null } });
      const img = await screen.findByTestId("profile-image");
      expect(img).toHaveAttribute(
        "src",
        expect.stringContaining("profile.png")
      );
    });

    it("displays custom user image", async () => {
      await setup({ userData: { ...baseUser, image: "custom.jpg" } });
      const img = await screen.findByTestId("profile-image");
      expect(img).toHaveAttribute("src", "custom.jpg");
    });
  });

  describe("Profile Update", () => {
    it("clears the profile edit success message after 3 seconds", async () => {
      await setup();

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Submit the form to trigger the success message
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Check that the success message is displayed
      await waitFor(() => {
        expect(screen.getByTestId("success-message")).toBeInTheDocument();
      });

      // Check that the success message is no longer displayed after 3 seconds
      await waitFor(
        () => {
          expect(
            screen.queryByTestId("success-message")
          ).not.toBeInTheDocument();
        },
        { timeout: 4000 } // Wait for 4 seconds to be safe
      );
    });

    it("displays success message after successful profile update", async () => {
      const { mockPut: _ } = await setup();

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Make a change and submit the form
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Verify success message is displayed
      await waitFor(() => {
        expect(screen.getByTestId("success-message")).toHaveTextContent(
          "Profile updated successfully"
        );
      });
    });
  });

  describe("Edit Form Cancellation", () => {
    it("reverts changes and exits edit mode when cancel button is clicked", async () => {
      const { userData } = await setup();

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toHaveTextContent(
          userData.username
        )
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Make changes to the form
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "changedusername" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "changed@example.com" },
      });

      // Click cancel button
      fireEvent.click(screen.getByTestId("cancel-edit-button"));

      // Verify edit mode is exited (edit form is no longer displayed)
      expect(screen.queryByTestId("edit-profile-form")).not.toBeInTheDocument();

      // Verify profile card is displayed with original data
      expect(screen.getByTestId("username")).toHaveTextContent(
        userData.username
      );
      expect(screen.getByTestId("email")).toHaveTextContent(userData.email);

      // Verify edit button is displayed again
      expect(screen.getByTestId("edit-profile-button")).toBeInTheDocument();
    });
  });

  describe("User Deletion Workflow", () => {
    it("clears delete success message after 3 seconds", async () => {
      await setup({ withAuth: true });
      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => {
        expect(screen.getByTestId("success-message")).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(
            screen.queryByTestId("success-message")
          ).not.toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });

    it("successfully deletes user and redirects", async () => {
      const { mockDelete } = await setup({ withAuth: true });
      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(API_ENDPOINTS.ME); // Should use ME endpoint for deletion
        expect(screen.getByTestId("success-message")).toHaveTextContent(
          "Account deleted successfully"
        );
        expect(window.location.pathname).toBe("/");
      });
    });

    it("handles delete errors", async () => {
      mockApiDeleteService.delete.mockRejectedValueOnce({
        response: { data: { message: "Deletion failed" } },
      });
      const { mockDelete } = await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Deletion failed"
        );
      });
      expect(mockDelete).toHaveBeenCalled();
    });

    it("preserves auth token when delete fails", async () => {
      mockApiDeleteService.delete.mockRejectedValueOnce({});
      const { mockDelete } = await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => expect(mockDelete).toHaveBeenCalled());
      expect(store.getState().auth.accessToken).toBe("test-access-token");
      expect(store.getState().auth.refreshToken).toBe("test-refresh-token");
    });

    it("cancels delete confirmation", async () => {
      const { mockDelete } = await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("cancel-delete-button"));

      expect(mockDelete).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("delete-confirmation-dialog")
      ).not.toBeInTheDocument();
    });
  });
});
