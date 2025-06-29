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
import { UserPageWrapper } from "./UserPage";
import { loginSuccess } from "../store/authSlice";
import i18n from "../locale/i18n";
import { fetchApiServiceDeleteUser } from "../services/apiService";

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

// Mock useParams
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )),
  useParams: () => ({ id: "1" }),
}));

describe("UserPage", () => {
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
      initialEntries = ["/user/1"],
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
            token: "test-token",
          })
        );
      });
    }

    let renderResult;
    await act(async () => {
      renderResult = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={initialEntries}>
            <UserPageWrapper
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

    it("preserves auth token during updates", async () => {
      const { mockPut } = await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("edit-profile-button"));
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => expect(mockPut).toHaveBeenCalled());
      expect(store.getState().auth.token).toBe("test-token");
      expect(mockPut).toHaveBeenCalledWith(
        "/api/1.0/users/1",
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
        initialEntries: ["/user/999"],
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

  describe("i18n Integration", () => {
    const languageCases = [
      {
        lang: "en",
        translations: {
          edit: "Edit Profile",
          save: "Save Changes",
          cancel: "Cancel",
          username: "Username",
          email: "E-mail",
          imageUrl: "Profile Image Path",
          error: "User not found",
          updateError: "Update failed",
          success: "Profile updated successfully",
        },
        direction: "ltr",
      },
      {
        lang: "ml",
        translations: {
          edit: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
          save: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
          cancel: "റദ്ദാക്കുക",
          username: "ഉപയോക്തൃനാമം",
          email: "ഇമെയിൽ",
          imageUrl: "പ്രൊഫൈൽ ചിത്രത്തിന്റെ പാത്ത്",
          error: "ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല",
          updateError: "അപ്ഡേറ്റ് പരാജയപ്പെട്ടു",
          success: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
        },
        direction: "ltr",
      },
      {
        lang: "ar",
        translations: {
          edit: "تعديل الملف الشخصي",
          save: "حفظ",
          cancel: "إلغاء",
          username: "اسم المستخدم",
          email: "البريد الإلكتروني",
          imageUrl: "مسار صورة الملف الشخصي",
          error: "لم يتم العثور على المستخدم",
          updateError: "فشل التحديث",
          success: "تم تحديث الملف الشخصي بنجاح",
        },
        direction: "rtl",
      },
    ];

    it.each(languageCases)(
      "displays $lang UI elements correctly",
      async ({ lang, translations }) => {
        await setup({ language: lang });

        // Test initial state
        await waitFor(() =>
          expect(screen.getByTestId("username")).toBeInTheDocument()
        );
        expect(screen.getByTestId("edit-profile-button")).toHaveTextContent(
          translations.edit
        );

        // Test edit mode
        fireEvent.click(screen.getByTestId("edit-profile-button"));
        expect(screen.getByTestId("save-profile-button")).toHaveTextContent(
          translations.save
        );
        expect(screen.getByTestId("cancel-edit-button")).toHaveTextContent(
          translations.cancel
        );

        // Check form labels
        expect(
          screen.getByLabelText(translations.username)
        ).toBeInTheDocument();
        expect(screen.getByLabelText(translations.email)).toBeInTheDocument();
        expect(
          screen.getByLabelText(translations.imageUrl)
        ).toBeInTheDocument();
      }
    );

    it.each(languageCases)(
      "handles $lang API errors",
      async ({ lang, translations }) => {
        const mockError = vi.fn().mockRejectedValue({
          response: { data: { message: "User not found" } },
        });

        await setup({
          language: lang,
          mockGet: mockError,
        });

        await waitFor(
          () => {
            expect(screen.getByTestId("error-message")).toHaveTextContent(
              translations.error
            );
          },
          { timeout: 3000 }
        );
      }
    );

    it.each(languageCases)(
      "handles $lang update errors",
      async ({ lang, translations }) => {
        await setup({ language: lang });

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
        await waitFor(
          () => {
            expect(screen.getByTestId("error-message")).toHaveTextContent(
              translations.updateError
            );
          },
          { timeout: 3000 }
        );
      }
    );

    it.each(languageCases)(
      "handles $lang success messages",
      async ({ lang, translations }) => {
        await setup({ language: lang });

        // Wait for user data to load
        await waitFor(() =>
          expect(screen.getByTestId("username")).toBeInTheDocument()
        );

        // Enter edit mode
        fireEvent.click(screen.getByTestId("edit-profile-button"));

        // Submit the form
        fireEvent.click(screen.getByTestId("save-profile-button"));

        // Check success message
        await waitFor(() => {
          expect(screen.getByTestId("success-message")).toHaveTextContent(
            translations.success
          );
        });
      }
    );

    it.each(languageCases)(
      "maintains $lang text direction",
      async ({ lang, direction }) => {
        await setup({ language: lang });
        await waitFor(() => screen.getByTestId("username"));
        expect(document.documentElement.dir).toBe(direction);
      }
    );
  });

  describe("Profile Update", () => {
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
    it("successfully deletes user and redirects", async () => {
      const { mockDelete } = await setup({ withAuth: true });
      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith("/api/1.0/users/1");
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
      expect(store.getState().auth.token).toBe("test-token");
    });

    it("cancels delete confirmation", async () => {
      const { mockDelete } = await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("cancel-delete-button"));

      expect(mockDelete).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("confirm-delete-dialog")
      ).not.toBeInTheDocument();
    });

    it("successfully deletes user using MSW integration", async () => {
      // Dispatch login success to set the correct token in the store
      act(() => {
        store.dispatch(
          loginSuccess({
            id: 1,
            username: "authedUser",
            token: "mock-jwt-token",
          })
        );
      });

      // Use the real API service with MSW handler
      await setup({
        mockDelete: fetchApiServiceDeleteUser.delete,
      });

      fireEvent.click(await screen.findByTestId("delete-profile-button"));
      fireEvent.click(screen.getByTestId("confirm-delete-button"));

      await waitFor(() => {
        // Verify UI feedback
        expect(screen.getByTestId("success-message")).toHaveTextContent(
          "Account deleted successfully"
        );
        // Verify navigation
        expect(window.location.pathname).toBe("/");
        // Verify auth state cleared
        expect(store.getState().auth).toEqual({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      });
    });
  });
});
