import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  logout as logoutAction,
  showLogoutMessage,
} from "../../store/authSlice";
import { ApiService } from "../../services/apiService";

export const useLogout = (apiService: ApiService) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Performs logout operation
   *
   * Process:
   * 1. Call backend logout API
   * 2. Dispatch logout and showLogoutMessage actions to update Redux state
   * 3. Navigate to home page
   * 4. Trigger user list refresh (if needed)
   */
  const logout = async (): Promise<void> => {
    try {
      await apiService.post("/api/1.0/logout");
      dispatch(logoutAction());
      dispatch(showLogoutMessage());
      navigate("/");

      // Refresh user list if needed
      const refreshEvent = new CustomEvent("userListRefresh");
      window.dispatchEvent(refreshEvent);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { logout };
};
