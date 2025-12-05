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
import { loginSuccess } from "../store/actions";
import i18n from "../locale/i18n";
import { fetchApiServiceDeleteUser } from "../services/apiService";
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

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )),
  useParams: () => ({ id: "1" }),
  useNavigate: () => mockNavigate,
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

    it("navigates to profile page with edit state when edit button is clicked", async () => {
      await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("edit-profile-button"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/profile", {
          state: { showEditForm: true },
        });
      });
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

    it("handles user not found with 'detail' field in error response", async () => {
      const mockError = vi.fn().mockRejectedValue({
        response: { data: { detail: "Not found." } },
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
          updateError: "Update failed",
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
          updateError: "Update failed",
          success: "تم تحديث الملف الشخصي بنجاح",
        },
        direction: "rtl",
      },
    ];

    it.each(languageCases)(
      "handles $lang API errors",
      async ({ lang, translations }) => {
        const mockError = vi.fn().mockRejectedValue({
          response: { data: { detail: "Not found." } },
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
      "maintains $lang text direction",
      async ({ lang, direction }) => {
        await setup({ language: lang });
        await waitFor(() => screen.getByTestId("username"));
        expect(document.documentElement.dir).toBe(direction);
      }
    );
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
        expect(mockDelete).toHaveBeenCalledWith(API_ENDPOINTS.DELETE_USER(1));
        expect(screen.getByTestId("success-message")).toHaveTextContent(
          "Account deleted successfully"
        );
        expect(window.location.pathname).toBe("/");
      });
    });

    it("handles delete errors", async () => {
      mockApiDeleteService.delete.mockRejectedValueOnce({
        response: { data: { detail: "Deletion failed" } },
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
            access: "mock-access-token",
            refresh: "mock-refresh-token",
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
          accessToken: null,
          refreshToken: null,
          showLogoutMessage: false,
        });
      });
    });
  });
});
