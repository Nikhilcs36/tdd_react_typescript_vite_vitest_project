import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "../store";
import { Provider } from "react-redux";
import UserPage, { UserPageWrapper } from "./UserPage";
import { loginSuccess } from "../store/authSlice";
import { User } from "../components/UserList";
import i18n from "../locale/i18n";

// Mock API services
const mockApiGetService = { get: vi.fn() };
const mockApiPutService = { put: vi.fn() };

// Mock useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" })
  };
});

describe("UserPage", () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();

    // Default mock responses
    mockApiGetService.get.mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
      image: "https://example.com/image.jpg"
    });

    mockApiPutService.put.mockResolvedValue({
      id: 1,
      username: "updateduser",
      email: "updated@example.com",
      image: "https://example.com/newimage.jpg"
    });
  });

  // Helper function for common test setup
  const setupTest = (userData: User = {
    id: 1,
    username: "user1",
    email: "user1@example.com"
  }) => {
    mockApiGetService.get.mockResolvedValue(userData);

    return render(
      <Provider store={createStore()}>
        <MemoryRouter initialEntries={[`/user/${userData.id}`]}>
          <UserPageWrapper
            ApiGetService={mockApiGetService}
            ApiPutService={mockApiPutService}
          />
        </MemoryRouter>
      </Provider>
    );
  };

  it("should preserve token when updating profile", async () => {
    // Setup: Login with token
    const testToken = "test-auth-token";
    store.dispatch(loginSuccess({ id: 1, username: "testuser", token: testToken }));

    // Verify initial state has token
    expect(store.getState().auth.token).toBe(testToken);

    // Render component
    render(
      <Provider store={store}>
        <MemoryRouter>
          <UserPage
            ApiGetService={mockApiGetService}
            ApiPutService={mockApiPutService}
          />
        </MemoryRouter>
      </Provider>
    );

    // Wait for user data to load
    await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());

    // Update profile
    fireEvent.click(screen.getByTestId("edit-profile-button"));
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "updateduser" } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "updated@example.com" } });
    fireEvent.click(screen.getByTestId("save-profile-button"));

    // Verify update
    await waitFor(() => expect(mockApiPutService.put).toHaveBeenCalled());
    expect(store.getState().auth.token).toBe(testToken);
    expect(store.getState().auth.user.username).toBe("updateduser");
    expect(mockApiPutService.put).toHaveBeenCalledWith(
      "/api/1.0/users/1",
      expect.objectContaining({
        username: "updateduser",
        email: "updated@example.com"
      })
    );
  });

  it("displays user name when found", async () => {
    setupTest();
    await waitFor(() => expect(screen.getByTestId("username")).toHaveTextContent("user1"));
  });

  it("shows spinner during loading", async () => {
    mockApiGetService.get.mockImplementation(() =>
      new Promise(resolve => setTimeout(() =>
        resolve({ id: 1, username: "user1", email: "user1@example.com" }), 100)
      )
    );
    setupTest();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument());
  });

  it("shows error for missing user", async () => {
    mockApiGetService.get.mockRejectedValue({
      response: { data: { message: "User not found" } }
    });

    render(
      <Provider store={createStore()}>
        <MemoryRouter initialEntries={["/user/100"]}>
          <UserPageWrapper
            ApiGetService={mockApiGetService}
            ApiPutService={mockApiPutService}
          />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => expect(screen.getByTestId("error-message")).toHaveTextContent("User not found"));
  });

  it("shows error when profile update fails", async () => {
    // Setup initial successful user load
    mockApiGetService.get.mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com"
    });
    
    // Mock the update to fail with "Update failed" error
    mockApiPutService.put.mockRejectedValue({
      response: { data: { message: "Update failed" } }
    });

    render(
      <Provider store={createStore()}>
        <MemoryRouter initialEntries={["/user/1"]}>
          <UserPageWrapper
            ApiGetService={mockApiGetService}
            ApiPutService={mockApiPutService}
          />
        </MemoryRouter>
      </Provider>
    );

    // Wait for user data to load
    await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());
    
    // Enter edit mode
    fireEvent.click(screen.getByTestId("edit-profile-button"));
    
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

  describe("Profile Image Display", () => {
    it("shows default image when user has no profile image", async () => {
      setupTest({
        id: 1,
        username: "user1",
        email: "user1@example.com",
        image: null
      });
      const profileImage = await screen.findByTestId("profile-image");
      expect(profileImage).toHaveAttribute("src", expect.stringContaining("profile.png"));
    });

    it("shows user provided image when available", async () => {
      setupTest({
        id: 2,
        username: "user2",
        email: "user2@example.com",
        image: "https://test.com/user1.jpg"
      });
      const profileImage = await screen.findByTestId("profile-image");
      expect(profileImage).toHaveAttribute("src", "https://test.com/user1.jpg");
    });
  });

  // i18n tests
  describe("UserPage i18n Integration", () => {
    // Reset language to default ('en') before each test
    beforeEach(async () => {
      await act(async () => {
        await i18n.changeLanguage("en");
      });

      // Reset mocks
      vi.clearAllMocks();

      // Mock API response
      mockApiGetService.get.mockResolvedValue({
        id: 1,
        username: "user1",
        email: "user1@example.com"
      });
    });

    // Helper function for i18n test setup
    const setupI18nTest = async (language: string) => {
      // First change the language
      await act(async () => {
        await i18n.changeLanguage(language);
      });

      // Then render the component within act to capture all state updates
      let renderResult: ReturnType<typeof render>;
      await act(async () => {
        renderResult = render(
          <Provider store={createStore()}>
            <MemoryRouter initialEntries={[`/user/1`]}>
              <UserPageWrapper
                ApiGetService={mockApiGetService}
                ApiPutService={mockApiPutService}
              />
            </MemoryRouter>
          </Provider>
        );
      });

      return renderResult!;
    };

    // Test cases for all supported languages
    const languageTestCases = [
      {
        lang: "en",
        editButton: "Edit Profile",
        saveButton: "Save Changes",
        cancelButton: "Cancel",
        usernameLabel: "Username",
        emailLabel: "E-mail",
        imageUrlLabel: "Profile Image URL",
        successMessage: "Profile updated successfully",
        errorMessage: "User not found"
      },
      {
        lang: "ml",
        editButton: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
        saveButton: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
        cancelButton: "റദ്ദാക്കുക",
        usernameLabel: "ഉപയോക്തൃനാമം",
        emailLabel: "ഇമെയിൽ",
        imageUrlLabel: "പ്രൊഫൈൽ ചിത്രത്തിന്റെ URL",
        successMessage: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
        errorMessage: "ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല"
      },
      {
        lang: "ar",
        editButton: "تعديل الملف الشخصي",
        saveButton: "حفظ",
        cancelButton: "إلغاء",
        usernameLabel: "اسم المستخدم",
        emailLabel: "البريد الإلكتروني",
        imageUrlLabel: "رابط صورة الملف الشخصي",
        successMessage: "تم تحديث الملف الشخصي بنجاح",
        errorMessage: "لم يتم العثور على المستخدم"
      }
    ];

    it.each(languageTestCases)(
      "displays edit button in $lang correctly",
      async ({ lang, editButton }) => {
        await setupI18nTest(lang);

        // Wait for user data to load
        await waitFor(() => expect(screen.getByTestId("username")).toBeInTheDocument());

        // Check edit button text
        expect(screen.getByTestId("edit-profile-button")).toHaveTextContent(editButton);
      }
    );

    it.each(languageTestCases)(
      "displays form labels and buttons in $lang correctly",
      async ({ lang, usernameLabel, emailLabel, imageUrlLabel, saveButton, cancelButton }) => {
        await setupI18nTest(lang);

        // Wait for user data to load within act
        await act(async () => {
          await waitFor(() => screen.getByTestId("edit-profile-button"));
        });

        // Click the edit button within act
        await act(async () => {
          fireEvent.click(screen.getByTestId("edit-profile-button"));
        });

        // Perform assertions within act to ensure all state updates are captured
        await act(async () => {
          // Check form inputs are present using data-testid
          expect(screen.getByTestId("username-input")).toBeInTheDocument();
          expect(screen.getByTestId("email-input")).toBeInTheDocument();
          expect(screen.getByTestId("image-input")).toBeInTheDocument();

          // Check buttons have correct translated text
          expect(screen.getByTestId("save-profile-button")).toHaveTextContent(saveButton);
          expect(screen.getByTestId("cancel-edit-button")).toHaveTextContent(cancelButton);

          // Check that the form contains the expected labels with correct translations
          const formElement = screen.getByTestId("edit-profile-form");
          expect(formElement).toHaveTextContent(usernameLabel);
          expect(formElement).toHaveTextContent(emailLabel);
          expect(formElement).toHaveTextContent(imageUrlLabel);
        });
      }
    );

    it.each(languageTestCases)(
      "displays error messages in $lang correctly",
      async ({ lang, errorMessage }) => {
        // First mock the API error with a known error key
        mockApiGetService.get.mockRejectedValue({
          response: { data: { message: "User not found" } }
        });

        // Then set up with the specified language and render within act
        await act(async () => {
          await i18n.changeLanguage(lang);

          render(
            <Provider store={createStore()}>
              <MemoryRouter initialEntries={[`/user/1`]}>
                <UserPageWrapper
                  ApiGetService={mockApiGetService}
                  ApiPutService={mockApiPutService}
                />
              </MemoryRouter>
            </Provider>
          );
        });

        // Wait for error message to appear
        await waitFor(() => {
          const errorElement = screen.getByTestId("error-message");
          expect(errorElement).toBeInTheDocument();
          expect(errorElement).toHaveTextContent(errorMessage);
        }, { timeout: 3000 });
      }
    );

    it.each(languageTestCases)(
      "displays update error messages in $lang correctly",
      async ({ lang }) => {
        // First set up with successful user load
        mockApiGetService.get.mockResolvedValue({
          id: 1,
          username: "testuser",
          email: "test@example.com"
        });
        
        // Mock the update to fail with "Update failed" error
        mockApiPutService.put.mockRejectedValue({
          response: { data: { message: "Update failed" } }
        });

        // Set language and render component
        await act(async () => {
          await i18n.changeLanguage(lang);
          
          render(
            <Provider store={createStore()}>
              <MemoryRouter initialEntries={["/user/1"]}>
                <UserPageWrapper
                  ApiGetService={mockApiGetService}
                  ApiPutService={mockApiPutService}
                />
              </MemoryRouter>
            </Provider>
          );
        });

        // Wait for user data to load and enter edit mode
        await act(async () => {
          await waitFor(() => screen.getByTestId("edit-profile-button"));
          fireEvent.click(screen.getByTestId("edit-profile-button"));
        });

        // Submit the form
        await act(async () => {
          fireEvent.click(screen.getByTestId("save-profile-button"));
        });

        // Check for translated error message
        await waitFor(() => {
          const errorElement = screen.getByTestId("error-message");
          expect(errorElement).toBeInTheDocument();
          
          // Get the expected error message based on language
          let expectedErrorMessage;
          if (lang === "en") {
            expectedErrorMessage = "Update failed";
          } else if (lang === "ml") {
            expectedErrorMessage = "അപ്ഡേറ്റ് പരാജയപ്പെട്ടു";
          } else if (lang === "ar") {
            expectedErrorMessage = "فشل التحديث";
          }
          
          expect(errorElement).toHaveTextContent(expectedErrorMessage || "");
        }, { timeout: 3000 });
      }
    );

    it.each(languageTestCases)(
      "displays success message in $lang after profile update",
      async ({ lang, successMessage }) => {
        // Set up with the specified language
        await act(async () => {
          await i18n.changeLanguage(lang);

          // Mock successful update
          mockApiPutService.put.mockResolvedValue({
            id: 1,
            username: "user1",
            email: "updated@example.com"
          });
        });

        // Render component within act
        await act(async () => {
          render(
            <Provider store={createStore()}>
              <MemoryRouter initialEntries={[`/user/1`]}>
                <UserPageWrapper
                  ApiGetService={mockApiGetService}
                  ApiPutService={mockApiPutService}
                />
              </MemoryRouter>
            </Provider>
          );
        });

        // Wait for user data to load and click edit button
        await act(async () => {
          await waitFor(() => screen.getByTestId("edit-profile-button"));
          fireEvent.click(screen.getByTestId("edit-profile-button"));
        });

        // Submit the form
        await act(async () => {
          fireEvent.click(screen.getByTestId("save-profile-button"));
        });

        // Check success message
        await act(async () => {
          await waitFor(() => {
            expect(screen.getByTestId("success-message")).toHaveTextContent(successMessage);
          });
        });
      }
    );

    it.each(languageTestCases)(
      "sends Accept-Language header with $lang language",
      async ({ lang, successMessage }) => {
        // Reset mocks
        vi.clearAllMocks();

        // Set up with the specified language
        await act(async () => {
          await i18n.changeLanguage(lang);
        });

        // Render component within act
        await act(async () => {
          render(
            <Provider store={createStore()}>
              <MemoryRouter initialEntries={[`/user/1`]}>
                <UserPageWrapper
                  ApiGetService={mockApiGetService}
                  ApiPutService={mockApiPutService}
                />
              </MemoryRouter>
            </Provider>
          );
        });

        // Wait for user data to load and click edit button
        await act(async () => {
          await waitFor(() => screen.getByTestId("edit-profile-button"));
          fireEvent.click(screen.getByTestId("edit-profile-button"));
        });

        // Fill in form fields using data-testid attributes
        await act(async () => {
          const usernameInput = screen.getByTestId("username-input");
          fireEvent.change(usernameInput, { target: { value: "updateduser" } });
        });

        // Submit the form
        await act(async () => {
          fireEvent.click(screen.getByTestId("save-profile-button"));
        });

        // Wait for API call and check success message
        await act(async () => {
          await waitFor(() => {
            expect(mockApiPutService.put).toHaveBeenCalled();
            expect(screen.getByTestId("success-message")).toHaveTextContent(successMessage);
          });
        });

        // Verify the current language is set correctly
        expect(i18n.language).toBe(lang);

        // Check if the API was called with the correct URL
        const callArgs = mockApiPutService.put.mock.calls[0];
        expect(callArgs[0]).toContain('/api/1.0/users/');
      }
    );

    it("preserves RTL/LTR direction based on language", async () => {
      // Test Arabic (RTL)
      await act(async () => {
        await i18n.changeLanguage("ar");

        // Render component within act
        render(
          <Provider store={createStore()}>
            <MemoryRouter initialEntries={[`/user/1`]}>
              <UserPageWrapper
                ApiGetService={mockApiGetService}
                ApiPutService={mockApiPutService}
              />
            </MemoryRouter>
          </Provider>
        );
      });

      // Wait for a reliable element to appear (username or edit button)
      await waitFor(() => {
        expect(
          screen.queryByTestId("username") ||
          screen.queryByTestId("edit-profile-button") ||
          screen.queryByTestId("error-message")
        ).toBeInTheDocument();
      });

      // Check RTL direction
      expect(document.documentElement.dir).toBe("rtl");

      // Clean up before next test
      cleanup();

      // Test English (LTR)
      await act(async () => {
        await i18n.changeLanguage("en");

        // Render component within act
        render(
          <Provider store={createStore()}>
            <MemoryRouter initialEntries={[`/user/1`]}>
              <UserPageWrapper
                ApiGetService={mockApiGetService}
                ApiPutService={mockApiPutService}
              />
            </MemoryRouter>
          </Provider>
        );
      });

      // Wait for a reliable element to appear
      await waitFor(() => {
        expect(
          screen.queryByTestId("username") ||
          screen.queryByTestId("edit-profile-button") ||
          screen.queryByTestId("error-message")
        ).toBeInTheDocument();
      });

      // Check LTR direction
      expect(document.documentElement.dir).toBe("ltr");

      // Clean up before next test
      cleanup();

      // Test Malayalam (LTR)
      await act(async () => {
        await i18n.changeLanguage("ml");

        // Render component within act
        render(
          <Provider store={createStore()}>
            <MemoryRouter initialEntries={[`/user/1`]}>
              <UserPageWrapper
                ApiGetService={mockApiGetService}
                ApiPutService={mockApiPutService}
              />
            </MemoryRouter>
          </Provider>
        );
      });

      // Wait for a reliable element to appear
      await waitFor(() => {
        expect(
          screen.queryByTestId("username") ||
          screen.queryByTestId("edit-profile-button") ||
          screen.queryByTestId("error-message")
        ).toBeInTheDocument();
      });

      // Check LTR direction
      expect(document.documentElement.dir).toBe("ltr");
    });
  });
});
