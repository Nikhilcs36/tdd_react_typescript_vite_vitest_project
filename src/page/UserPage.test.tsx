import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "../store";
import { Provider } from "react-redux";
import { UserPageWrapper } from "./UserPage";
import { loginSuccess } from "../store/authSlice";
import i18n from "../locale/i18n";

// Mock API services
const mockApiGetService = { get: vi.fn() };
const mockApiPutService = { put: vi.fn() };

// Mock useParams
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<typeof import("react-router-dom")>("react-router-dom")),
  useParams: () => ({ id: "1" })
}));

describe("UserPage", () => {
  let store: ReturnType<typeof createStore>;
  
  const baseUser = {
    id: 1,
    username: "user1",
    email: "user1@example.com",
    image: "https://example.com/image.jpg"
  };

  // Unified setup function
  const setup = async (options = {}) => {
    // Use type assertion to avoid TypeScript errors
    const opts = options as any;
    const {
      language = "en",
      initialEntries = ["/user/1"],
      userData = baseUser,
      mockGet = mockApiGetService.get.mockResolvedValue(userData),
      mockPut = mockApiPutService.put,
      withAuth = false
    } = opts;

    // Configure i18n - wrapped in act
    await act(async () => {
      await i18n.changeLanguage(language);
    });

    // Configure auth state
    if (withAuth) {
      await act(async () => {
        store.dispatch(loginSuccess({ 
          id: 1, 
          username: "authedUser",
          token: "test-token"
        }));
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
            />
          </MemoryRouter>
        </Provider>
      );
    });

    // Use object spread only with defined object values
    return {
      // Safely spread renderResult which is guaranteed to be an object
      ...(renderResult || {}),
      userData,
      mockGet,
      mockPut
    };
  };

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
    mockApiGetService.get.mockResolvedValue(baseUser);
    mockApiPutService.put.mockResolvedValue({
      ...baseUser,
      username: "updatedUser"
    });
  });

  afterEach(cleanup);

  describe("Core Functionality", () => {
    it("displays user name when found", async () => {
      await setup();
      await waitFor(() => expect(screen.getByTestId("username")).toHaveTextContent("user1"));
    });

    it("preserves auth token during updates", async () => {
      const { mockPut } = await setup({ withAuth: true });
      
      fireEvent.click(await screen.findByTestId("edit-profile-button"));
      fireEvent.change(screen.getByTestId("username-input"), { 
        target: { value: "updateduser" } 
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => expect(mockPut).toHaveBeenCalled());
      expect(store.getState().auth.token).toBe("test-token");
      expect(mockPut).toHaveBeenCalledWith(
        "/api/1.0/users/1",
        expect.objectContaining({
          username: "updateduser"
        })
      );
    });

    it("displays loading spinner", async () => {
      const delayedResolve = () => 
        new Promise((resolve) => 
          setTimeout(() => resolve(baseUser), 200)
        );
      
      await setup({ mockGet: vi.fn().mockImplementation(delayedResolve) });
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument());
    });

    it("handles user not found", async () => {
      const mockError = vi.fn().mockRejectedValue({
        response: { data: { message: "User not found" } }
      });
      
      await setup({ 
        initialEntries: ["/user/999"],
        mockGet: mockError 
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-message"))
          .toHaveTextContent("User not found");
      }, { timeout: 3000 });
    });

    it("handles update errors", async () => {
      await setup();
      
      // Wait for user data to load
      await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));
      
      // Mock the update to fail
      mockApiPutService.put.mockRejectedValueOnce({
        response: { data: { message: "Update failed" } }
      });
      
      // Make a change and submit the form
      fireEvent.change(screen.getByTestId("username-input"), { 
        target: { value: "updateduser" } 
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));
      
      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent("Update failed");
      });
    });
  });

  describe("Profile Image Handling", () => {
    it("shows default image when none provided", async () => {
      await setup({ userData: { ...baseUser, image: null } });
      const img = await screen.findByTestId("profile-image");
      expect(img).toHaveAttribute("src", expect.stringContaining("profile.png"));
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
          imageUrl: "Profile Image URL",
          error: "User not found",
          updateError: "Update failed",
          success: "Profile updated successfully"
        },
        direction: "ltr"
      },
      {
        lang: "ml",
        translations: {
          edit: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
          save: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
          cancel: "റദ്ദാക്കുക",
          username: "ഉപയോക്തൃനാമം",
          email: "ഇമെയിൽ",
          imageUrl: "പ്രൊഫൈൽ ചിത്രത്തിന്റെ URL",
          error: "ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല",
          updateError: "അപ്ഡേറ്റ് പരാജയപ്പെട്ടു",
          success: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു"
        },
        direction: "ltr"
      },
      {
        lang: "ar",
        translations: {
          edit: "تعديل الملف الشخصي",
          save: "حفظ",
          cancel: "إلغاء",
          username: "اسم المستخدم",
          email: "البريد الإلكتروني",
          imageUrl: "رابط صورة الملف الشخصي",
          error: "لم يتم العثور على المستخدم",
          updateError: "فشل التحديث",
          success: "تم تحديث الملف الشخصي بنجاح"
        },
        direction: "rtl"
      }
    ];

    it.each(languageCases)("displays $lang UI elements correctly", async ({ lang, translations }) => {
      await setup({ language: lang });
      
      // Test initial state
      await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());
      expect(screen.getByTestId("edit-profile-button")).toHaveTextContent(translations.edit);

      // Test edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));
      expect(screen.getByTestId("save-profile-button")).toHaveTextContent(translations.save);
      expect(screen.getByTestId("cancel-edit-button")).toHaveTextContent(translations.cancel);
      
      // Check form labels
      expect(screen.getByLabelText(translations.username)).toBeInTheDocument();
      expect(screen.getByLabelText(translations.email)).toBeInTheDocument();
      expect(screen.getByLabelText(translations.imageUrl)).toBeInTheDocument();
    });

    it.each(languageCases)("handles $lang API errors", async ({ lang, translations }) => {
      const mockError = vi.fn().mockRejectedValue({
        response: { data: { message: "User not found" } }
      });

      await setup({ 
        language: lang,
        mockGet: mockError
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-message"))
          .toHaveTextContent(translations.error);
      }, { timeout: 3000 });
    });

    it.each(languageCases)("handles $lang update errors", async ({ lang, translations }) => {
      await setup({ language: lang });
      
      // Wait for user data to load
      await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));
      
      // Mock the update to fail
      mockApiPutService.put.mockRejectedValueOnce({
        response: { data: { message: "Update failed" } }
      });
      
      // Make a change and submit the form
      fireEvent.change(screen.getByTestId("username-input"), { 
        target: { value: "updateduser" } 
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));
      
      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(translations.updateError);
      }, { timeout: 3000 });
    });

    it.each(languageCases)("handles $lang success messages", async ({ lang, translations }) => {
      await setup({ language: lang });
      
      // Wait for user data to load
      await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));
      
      // Submit the form
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Check success message
      await waitFor(() => {
        expect(screen.getByTestId("success-message"))
          .toHaveTextContent(translations.success);
      });
    });

    it.each(languageCases)("maintains $lang text direction", async ({ lang, direction }) => {
      await setup({ language: lang });
      await waitFor(() => screen.getByTestId("username"));
      expect(document.documentElement.dir).toBe(direction);
    });
  });
});
