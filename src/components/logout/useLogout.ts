import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout as logoutAction } from "../../store/authSlice";
import { ApiService } from "../../services/apiService";

/**
 * Custom hook for handling user logout functionality
 *
 * Features:
 * - Calls backend logout API to invalidate session
 * - Only clears local state after successful backend confirmation
 * - Redirects to home page after successful logout
 *
 * @param apiService - The API service to use for logout calls (axios for production, fetch for testing)
 * @returns Object containing logout function
 */
export const useLogout = (apiService: ApiService) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Performs logout operation
   *
   * Process:
   * 1. Call backend logout API
   * 2. Clear Redux state and SecureLS after successful API call
   * 3. Redirect to home page and reload to refresh user list
   */
  const logout = async (): Promise<void> => {
    // Call backend logout API - this will include Authorization header automatically
    await apiService.post("/api/1.0/logout");

    // Only clear state after successful backend logout confirmation
    dispatch(logoutAction());

    // Redirect to home page after successful logout
    navigate("/");

    // Trigger user list refresh to show the previously authenticated user
    // Instead of reloading the entire page, dispatch a custom event to refresh only the user list
    const refreshEvent = new CustomEvent("userListRefresh");
    window.dispatchEvent(refreshEvent);
  };

  return {
    logout,
  };
};

export default useLogout;
