import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { showLogoutMessage } from "../../store/authSlice";
import { logoutSuccess } from "../../store/actions";
import { ApiService } from "../../services/apiService";
import { API_ENDPOINTS } from "../../services/apiEndpoints";

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
      await apiService.post(API_ENDPOINTS.LOGOUT);
      dispatch(logoutSuccess());
      dispatch(showLogoutMessage());
      navigate("/");

      // Refresh user list if needed - use setTimeout to ensure Redux state is updated
      // before triggering the refresh event
      setTimeout(() => {
        const refreshEvent = new CustomEvent("userListRefresh");
        window.dispatchEvent(refreshEvent);
      }, 0);
    } catch (error) {}
  };

  return { logout };
};
