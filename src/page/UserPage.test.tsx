import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "../store";
import { Provider } from "react-redux";
import UserPage, { UserPageWrapper } from "./UserPage";
import { loginSuccess } from "../store/authSlice";
import { User } from "../components/UserList";

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
});
