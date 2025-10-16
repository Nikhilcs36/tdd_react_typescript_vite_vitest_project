import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
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
import { axiosApiServiceUpdateUserWithFile } from "../services/apiService";

// Mock the apiService module to intercept the file upload service
vi.mock("../services/apiService", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../services/apiService")
  >();
  return {
    ...actual,
    axiosApiServiceUpdateUserWithFile: {
      put: vi.fn(),
    },
  };
});

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

// Mock URL.createObjectURL for file preview
global.URL.createObjectURL = vi.fn(() => "blob:test-preview-url");

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

    it("sends only the changed fields for partial updates", async () => {
      const { mockPut } = await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Change only the username
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });

      // Submit the form
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Verify that only the username is sent in the request
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith(API_ENDPOINTS.ME, {
          username: "updateduser",
        });
      });
    });

    it("sends only changed fields with image upload", async () => {
      await setup({ withAuth: true });
      (axiosApiServiceUpdateUserWithFile.put as Mock).mockResolvedValue({
        ...baseUser,
        username: "updateduser",
        image: "new-image.jpg",
      });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Change only the username
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });

      // Select a file
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByTestId("image-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Submit the form
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Verify that only the username and image are sent in the request
      await waitFor(() => {
        const formData = (axiosApiServiceUpdateUserWithFile.put as Mock).mock
          .calls[0][1] as FormData;
        expect(formData.get("username")).toBe("updateduser");
        expect(formData.has("email")).toBe(false);
        expect(formData.get("image")).toBe(file);
      });
    });

    it("makes image field read-only in edit form", async () => {
      await setup({ withAuth: true });

      fireEvent.click(await screen.findByTestId("edit-profile-button"));

      // Verify that the image input field is read-only
      const imageInput = screen.getByTestId("image-input");
      expect(imageInput).toHaveAttribute("readOnly");
      expect(imageInput).toHaveAttribute("disabled");

      // Verify that the read-only message is displayed (check for the specific text)
      const readOnlyMessage = screen.getByText(
        "Image URL cannot be edited directly"
      );
      expect(readOnlyMessage).toBeInTheDocument();
      expect(readOnlyMessage).toHaveClass("text-sm", "text-gray-500", "mt-1");
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
        response: { data: { detail: "User not found" } },
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
        response: { data: { detail: "Update failed" } },
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

    it("allows selecting image file from PC", async () => {
      await setup();

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Check that file input is available
      const fileInput = screen.getByTestId("image-file-input");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("type", "file");
      expect(fileInput).toHaveAttribute("accept", "image/*");
    });

    it("displays selected image preview", async () => {
      await setup();

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Create a mock file
      const file = new File(["dummy content"], "test-image.jpg", {
        type: "image/jpeg",
      });

      // Trigger file selection
      const fileInput = screen.getByTestId("image-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Check that image preview is displayed
      await waitFor(() => {
        const previewImg = screen.getByTestId("image-preview");
        expect(previewImg).toBeInTheDocument();
        expect(previewImg).toHaveAttribute("src");
      });
    });

    it.each([
      [
        "en",
        "Image URL cannot be edited directly",
        "Upload New Profile Image",
        "Choose file",
        "No file chosen",
      ],
      [
        "ml",
        "ചിത്ര URL നേരിട്ട് എഡിറ്റ് ചെയ്യാൻ കഴിയില്ല",
        "പുതിയ പ്രൊഫൈൽ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക",
        "ഫയൽ തിരഞ്ഞെടുക്കുക",
        "ഫയൽ തിരഞ്ഞെടുത്തിട്ടില്ല",
      ],
      [
        "ar",
        "لا يمكن تعديل رابط الصورة مباشرة",
        "تحميل صورة ملف شخصي جديدة",
        "اختر ملف",
        "لم يتم اختيار ملف",
      ],
    ])(
      "displays translations for %s language",
      async (
        language,
        imageUrlInfoText,
        uploadProfileImageText,
        chooseFileText,
        noFileChosenText
      ) => {
        await setup({ withAuth: true, language });

        // Wait for user data to load
        await waitFor(() =>
          expect(screen.getByTestId("username")).toBeInTheDocument()
        );

        // Enter edit mode
        fireEvent.click(screen.getByTestId("edit-profile-button"));

        // Check that all translations are displayed
        await waitFor(() => {
          expect(screen.getByText(imageUrlInfoText)).toBeInTheDocument();
          expect(screen.getByText(uploadProfileImageText)).toBeInTheDocument();
          expect(screen.getByText(chooseFileText)).toBeInTheDocument();
          expect(screen.getByText(noFileChosenText)).toBeInTheDocument();
        });
      }
    );

    it("displays selected file name when a file is chosen", async () => {
      await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Create a mock file
      const file = new File(["dummy content"], "test-image.jpg", {
        type: "image/jpeg",
      });

      // Trigger file selection
      const fileInput = screen.getByTestId("image-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Check that the selected file name is displayed in the custom file input button
      await waitFor(() => {
        const fileButtonText = screen.getByText("test-image.jpg", {
          selector: "span.text-gray-700",
        });
        expect(fileButtonText).toBeInTheDocument();
      });
    });

    it("sends a null image field when the clear image button is clicked", async () => {
      const { mockPut } = await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Find and click the clear image button
      const clearImageButton = screen.getByTestId("clear-image-button");
      fireEvent.click(clearImageButton);

      // Submit the form
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Verify that the request data contains image: null
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith(
          API_ENDPOINTS.ME,
          expect.objectContaining({
            image: null,
          })
        );
      });
    });

    it("resets the clear image state after successful submission", async () => {
      await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Find and click the clear image button
      const clearImageButton = screen.getByTestId("clear-image-button");
      fireEvent.click(clearImageButton);

      // Submit the form
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // Wait for the success message to ensure the form has been processed
      await waitFor(() => {
        expect(screen.getByTestId("success-message")).toBeInTheDocument();
      });

      // Re-enter edit mode to check the state of the button
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Verify that the clear image button is enabled (meaning no image is set to be cleared)
      const updatedClearImageButton = screen.getByTestId("clear-image-button");
      expect(updatedClearImageButton).toBeEnabled();
    });

    it("disables clear image button when there is no existing profile image", async () => {
      await setup({ userData: { ...baseUser, image: null } });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Verify that the clear image button is disabled
      const clearImageButton = screen.getByTestId("clear-image-button");
      expect(clearImageButton).toBeDisabled();
    });

    it("enables clear image button when there is an existing profile image", async () => {
      await setup({
        userData: { ...baseUser, image: "https://example.com/image.jpg" },
      });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Verify that the clear image button is enabled
      const clearImageButton = screen.getByTestId("clear-image-button");
      expect(clearImageButton).toBeEnabled();
    });

    it("clears previous image upload error when a new image is selected", async () => {
      // Mock a failed image upload response
      (axiosApiServiceUpdateUserWithFile.put as Mock).mockRejectedValue({
        response: {
          data: {
            image: [
              "Invalid image format. Only JPG, JPEG, and PNG are allowed.",
            ],
          },
        },
      });

      await setup({ withAuth: true });

      // 1. Enter edit mode
      fireEvent.click(await screen.findByTestId("edit-profile-button"));

      // 2. Simulate the first file upload that fails
      const file1 = new File(["dummy"], "test1.txt", { type: "text/plain" });
      fireEvent.change(screen.getByTestId("image-file-input"), {
        target: { files: [file1] },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // 3. Wait for the error message to be displayed
      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Invalid image format. Only JPG, JPEG, and PNG are allowed."
        );
      });

      // 4. Simulate selecting a new, valid image file
      const file2 = new File(["dummy"], "test2.jpg", { type: "image/jpeg" });
      fireEvent.change(screen.getByTestId("image-file-input"), {
        target: { files: [file2] },
      });

      // 5. Assert that the error message is cleared
      await waitFor(() => {
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      });
    });

    it("clears the file input after a successful image upload", async () => {
      // Mock a successful image upload response
      (axiosApiServiceUpdateUserWithFile.put as Mock).mockResolvedValue({
        ...baseUser,
        image: "new-image.jpg",
      });

      await setup({ withAuth: true });

      // 1. Enter edit mode
      fireEvent.click(await screen.findByTestId("edit-profile-button"));

      // 2. Simulate file selection
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByTestId(
        "image-file-input"
      ) as HTMLInputElement;
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      // 3. Verify the file name is displayed
      await waitFor(() => {
        expect(screen.getByText("test.jpg")).toBeInTheDocument();
      });

      // 4. Submit the form
      fireEvent.click(screen.getByTestId("save-profile-button"));

      // 5. Wait for the success message
      await waitFor(() => {
        expect(screen.getByTestId("success-message")).toBeInTheDocument();
      });

      // 6. Re-enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // 7. Assert that the file input is cleared
      await waitFor(() => {
        const fileInput = screen.getByTestId(
          "image-file-input"
        ) as HTMLInputElement;
        expect(fileInput.files?.length).toBe(0);
        expect(screen.getByText("Choose file")).toBeInTheDocument();
      });
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

      // Change the username to trigger an update
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "new-username" },
      });

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
      await setup();

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

    it("disables save button when no changes have been made", async () => {
      await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Verify save button is initially disabled (no changes)
      const saveButton = screen.getByTestId("save-profile-button");
      expect(saveButton).toBeDisabled();

      // Make a change to username
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "updateduser" },
      });

      // Verify save button is now enabled
      expect(saveButton).toBeEnabled();

      // Revert the change
      fireEvent.change(screen.getByTestId("username-input"), {
        target: { value: "user1" },
      });

      // Verify save button is disabled again
      expect(saveButton).toBeDisabled();
    });

    it("enables save button when file is selected", async () => {
      await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Verify save button is initially disabled
      const saveButton = screen.getByTestId("save-profile-button");
      expect(saveButton).toBeDisabled();

      // Select a file
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByTestId("image-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Verify save button is enabled after file selection
      expect(saveButton).toBeEnabled();
    });

    it("enables save button when clear image is clicked", async () => {
      await setup({ withAuth: true });

      // Wait for user data to load
      await waitFor(() =>
        expect(screen.getByTestId("username")).toBeInTheDocument()
      );

      // Enter edit mode
      fireEvent.click(screen.getByTestId("edit-profile-button"));

      // Verify save button is initially disabled
      const saveButton = screen.getByTestId("save-profile-button");
      expect(saveButton).toBeDisabled();

      // Click clear image button
      fireEvent.click(screen.getByTestId("clear-image-button"));

      // Verify save button is enabled after clear image
      expect(saveButton).toBeEnabled();
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
        screen.queryByTestId("delete-confirmation-dialog")
      ).not.toBeInTheDocument();
    });
  });

  describe("Internationalization user profile image upload", () => {
    it.each([
      {
        lang: "en",
        expected: "Invalid image format. Only JPG, JPEG, and PNG are allowed.",
      },
      {
        lang: "ml",
        expected:
          "അസാധുവായ ചിത്ര ഫോർമാറ്റ്. JPG, JPEG, PNG എന്നിവ മാത്രം അനുവദനീയമാണ്.",
      },
      {
        lang: "ar",
        expected: "تنسيق الصورة غير صالح. يُسمح فقط بصيغ JPG وJPEG وPNG.",
      },
    ])("displays image format error in $lang", async ({ lang, expected }) => {
      (axiosApiServiceUpdateUserWithFile.put as Mock).mockRejectedValue({
        response: {
          data: {
            image: [
              "Invalid image format. Only JPG, JPEG, and PNG are allowed.",
            ],
          },
        },
      });

      await setup({
        language: lang,
      });

      // Simulate form submission
      fireEvent.click(await screen.findByTestId("edit-profile-button"));
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(screen.getByTestId("image-file-input"), {
        target: { files: [file] },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(expected);
      });
    });

    it.each([
      {
        lang: "en",
        expected: "Image size cannot exceed 2MB.",
      },
      {
        lang: "ml",
        expected: "ചിത്രത്തിന്റെ വലുപ്പം 2MB കവിയാൻ പാടില്ല.",
      },
      {
        lang: "ar",
        expected: "لا يمكن أن يتجاوز حجم الصورة 2 ميجابايت.",
      },
    ])("displays image size error in $lang", async ({ lang, expected }) => {
      (axiosApiServiceUpdateUserWithFile.put as Mock).mockRejectedValue({
        response: {
          data: { image: ["Image size cannot exceed 2097152 bytes."] },
        },
      });

      await setup({
        language: lang,
      });

      // Simulate form submission
      fireEvent.click(await screen.findByTestId("edit-profile-button"));
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(screen.getByTestId("image-file-input"), {
        target: { files: [file] },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(expected);
      });
    });

    it.each([
      {
        lang: "en",
        expected: "Network Error",
      },
      {
        lang: "ml",
        expected: "നെറ്റ്‌വർക്ക് പിശക്",
      },
      {
        lang: "ar",
        expected: "خطأ في الشبكة",
      },
    ])("displays network error in $lang", async ({ lang, expected }) => {
      (axiosApiServiceUpdateUserWithFile.put as Mock).mockRejectedValue({
        message: "Network Error",
      });

      await setup({ language: lang });

      // Simulate form submission
      fireEvent.click(await screen.findByTestId("edit-profile-button"));
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(screen.getByTestId("image-file-input"), {
        target: { files: [file] },
      });
      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(expected);
      });
    });
  });
});
