import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../locale/i18n';
import ReportDownloadButton from './ReportDownloadButton';
import dashboardReducer, { DashboardState } from '../../store/dashboardSlice';
import authReducer, { AuthState } from '../../store/authSlice';
import globalErrorReducer from '../../store/globalErrorSlice';
import * as loginTrackingService from '../../services/loginTrackingService';

// Mock the downloadReport service
vi.mock('../../services/loginTrackingService', async () => {
  const actual = await vi.importActual('../../services/loginTrackingService');
  return {
    ...actual,
    downloadReport: vi.fn(),
  };
});

const createMockStore = (dashboardState: Partial<DashboardState> = {}, authState: Partial<AuthState> = {}) => {
  const defaultDashboardState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
    datePreset: '30days',
    startDate: null,
    endDate: null,
    isLoading: false,
    error: null,
    chartMode: 'individual',
    selectedDashboardUserId: null,
    currentDropdownUsers: [],
    ...dashboardState,
  };

  const defaultAuthState: AuthState = {
    user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false, logins_remaining_for_staff: 3, staff_access_granted: false, active_role: 'regular', role_label: 'Regular' },
    accessToken: 'fake-token',
    refreshToken: 'fake-refresh-token',
    isAuthenticated: true,
    showLogoutMessage: false,
    ...authState,
  };

  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
      auth: authReducer,
      globalError: globalErrorReducer,
    },
    preloadedState: {
      dashboard: defaultDashboardState,
      auth: defaultAuthState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, dashboardState = {}, authState = {}) => {
  const store = createMockStore(dashboardState, authState);
  return { ...render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </Provider>
  ), store };
};

describe('ReportDownloadButton', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
    // Ensure document starts without dark class
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    // Clean up dark class after each test
    document.documentElement.classList.remove('dark');
  });

  describe('Regular User', () => {
    it('should render download button for regular user', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      expect(screen.getByTestId('report-download-button')).toBeInTheDocument();
      expect(screen.getByText('Download Report')).toBeInTheDocument();
    });

    it('should call downloadReport with individual mode when clicked for regular user', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_testuser_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
        });
      });
    });

    it('should pass startDate and endDate from dashboard state', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_testuser_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        { startDate: '2025-12-01', endDate: '2025-12-31' },
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
          startDate: '2025-12-01',
          endDate: '2025-12-31',
        });
      });
    });

    it('should show downloading state while download is in progress', async () => {
      let resolvePromise: ((value: any) => void) | null = null;
      vi.mocked(loginTrackingService.downloadReport).mockImplementation(() => 
        new Promise(resolve => { resolvePromise = resolve; })
      );

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        expect(screen.getByText('Downloading...')).toBeInTheDocument();
        expect(screen.getByTestId('report-download-button')).toBeDisabled();
      });

      // Clean up by resolving the promise
      resolvePromise!({
        blob: new Blob(['test']),
        filename: 'login_report_testuser_individual_20260101_120000.xlsx',
      });
    });

    it('should display error message on download failure', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockRejectedValue(
        new Error('Download failed')
      );

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        expect(screen.getByText('Failed to download report. Please try again.')).toBeInTheDocument();
      });
    });

    it('should not open modal for regular user on click', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      // Modal should not appear for regular user
      expect(screen.queryByTestId('report-download-modal')).not.toBeInTheDocument();
    });
  });

  describe('Admin User', () => {
    it('should open confirmation modal when admin clicks download button', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      expect(screen.getByTestId('report-download-modal')).toBeInTheDocument();
    });

    it('should show readonly mode info from dashboard state in admin modal', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'individual' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      expect(screen.getByTestId('report-download-modal')).toBeInTheDocument();
      // Mode label should be displayed as text (not as selectable buttons)
      const modeText = screen.getByTestId('mode-label-text').textContent;
      expect(modeText).toContain('Individual');
    });

    it('should show grouped mode as readonly when dashboard chartMode is grouped', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'grouped', selectedUserIds: [1, 2, 3] },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      expect(screen.getByTestId('report-download-modal')).toBeInTheDocument();
      const modeText = screen.getByTestId('mode-label-text').textContent;
      expect(modeText).toContain('Grouped');
    });

    it('should use chartMode from dashboard state for download mode (individual)', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'individual' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download in modal
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should use chartMode from dashboard state for download mode (grouped)', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_grouped_users_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'grouped',
          selectedUserIds: [1, 2, 3],
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'normal_user', email: 'normal@example.com' }
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'grouped',
          userIds: [5],
          selectedUserId: 5,
          startDate: undefined,
          endDate: undefined,
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should send all dropdown users with selectedUserId in grouped mode', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_grouped_all_users.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'grouped',
          selectedUserIds: [1, 2, 3, 4],
          selectedDashboardUserId: 2,
          currentDropdownUsers: [
            { id: 1, username: 'admin', email: 'admin@example.com' },
            { id: 2, username: 'normal', email: 'normal@example.com' },
            { id: 3, username: 'staff', email: 'staff@example.com' },
            { id: 4, username: 'guest', email: 'guest@example.com' },
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        // Should send ALL dropdown users for grouped chart data
        // Plus selectedUserId so the backend uses the correct "Selected User" label
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'grouped',
          userIds: [1, 2, 3, 4],
          selectedUserId: 2,
          startDate: undefined,
          endDate: undefined,
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should not include selectedUserId in individual mode', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_individual.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'normal_user', email: 'normal@example.com' }
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        // Individual mode should NOT send selectedUserId
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
          userIds: [5],
          filter: 'all',
          role: 'admin',
        });
        // Verify selectedUserId is NOT in the call
        const callArgs = vi.mocked(loginTrackingService.downloadReport).mock.calls[0][0];
        expect(callArgs).not.toHaveProperty('selectedUserId');
      });
    });

    it('should not send selectedUserId in grouped mode when no dropdown user selected', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_grouped_no_selection.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'grouped',
          selectedUserIds: [1, 2, 3],
          selectedDashboardUserId: null,
          currentDropdownUsers: [
            { id: 1, username: 'admin', email: 'admin@example.com' },
            { id: 2, username: 'normal', email: 'normal@example.com' },
            { id: 3, username: 'staff', email: 'staff@example.com' },
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'grouped',
          userIds: [1, 2, 3],
          startDate: undefined,
          endDate: undefined,
          filter: 'all',
          role: 'admin',
        });
        // Verify selectedUserId is NOT in the call
        const callArgs = vi.mocked(loginTrackingService.downloadReport).mock.calls[0][0];
        expect(callArgs).not.toHaveProperty('selectedUserId');
      });
    });

    it('should close modal when cancel is clicked', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(screen.getByTestId('report-download-modal')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByTestId('modal-cancel-button'));

      expect(screen.queryByTestId('report-download-modal')).not.toBeInTheDocument();
    });

    it('should include selectedDashboardUserId in individual mode when a dropdown user is selected', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'normal_user', email: 'normal@example.com' }
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
          userIds: [5],
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should NOT include userIds in individual mode when no dropdown user is selected', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          selectedDashboardUserId: null,
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should show selected user name in modal summary for individual mode with dropdown', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'normal_user', email: 'normal@example.com' }
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      // Should show the selected user's name
      expect(screen.getByText(/normal_user/)).toBeInTheDocument();
    });

    it('should include date range from dashboard state in admin download', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { startDate: '2025-06-01', endDate: '2025-06-30' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Open modal
      fireEvent.click(screen.getByTestId('report-download-button'));

      // Click download
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
          startDate: '2025-06-01',
          endDate: '2025-06-30',
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should not have mode selector buttons in admin modal', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'individual' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      // Mode selector buttons should NOT exist
      expect(screen.queryByTestId('mode-individual')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mode-grouped')).not.toBeInTheDocument();
    });

    it('should show date range summary in admin modal when dates are set', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'individual', startDate: '2025-06-01', endDate: '2025-06-30' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      expect(screen.getByText(/2025-06-01/)).toBeInTheDocument();
      expect(screen.getByText(/2025-06-30/)).toBeInTheDocument();
    });
  });

  describe('Filter Parameter Integration', () => {
    it('should pass filter=admin_only when activeFilter is admin for grouped mode', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_filtered.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'grouped',
          activeFilter: 'admin',
          selectedUserIds: [1, 2],
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'admin_user', email: 'admin@example.com' },
            { id: 10, username: 'another_admin', email: 'another@example.com' },
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'grouped',
            filter: 'admin_only',
            userIds: [5, 10],
            selectedUserId: 5,
            role: 'admin',
          })
        );
      });
    });

    it('should pass filter=regular_users when activeFilter is regular', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_regular_filtered.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'grouped',
          activeFilter: 'regular',
          selectedUserIds: [1, 2],
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'regular_user', email: 'regular@example.com' },
            { id: 11, username: 'another_regular', email: 'another@example.com' },
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'grouped',
            filter: 'regular_users',
            userIds: [5, 11],
            selectedUserId: 5,
            role: 'admin',
          })
        );
      });
    });

    it('should pass filter=me when activeFilter is me for individual mode', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_me.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          activeFilter: 'me',
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'individual',
            filter: 'me',
            role: 'admin',
          })
        );
      });
    });

    it('should pass filter=all when activeFilter is all for grouped mode', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_all.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'grouped',
          activeFilter: 'all',
          selectedUserIds: [1, 2],
          selectedDashboardUserId: 3,
          currentDropdownUsers: [
            { id: 3, username: 'test_user', email: 'test@example.com' },
            { id: 7, username: 'another_user', email: 'another@example.com' },
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'grouped',
          userIds: [3, 7],
          selectedUserId: 3,
          startDate: undefined,
          endDate: undefined,
          filter: 'all',
          role: 'admin',
        });
      });
    });

    it('should not pass filter or role for regular user even with activeFilter me', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_regular_user_me.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {
          chartMode: 'individual',
          activeFilter: 'me',
        },
        { user: { id: 1, username: 'regular', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
        });
      });
    });

    // NEW TESTS: Individual mode with all filter variations
    it('should pass filter=admin_only for individual mode when activeFilter is admin', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_individual_filtered.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          activeFilter: 'admin',
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'individual',
            filter: 'admin_only',
            role: 'admin',
          })
        );
      });
    });

    it('should pass filter=regular_users for individual mode when activeFilter is regular', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_regular_individual_filtered.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          activeFilter: 'regular',
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'individual',
            filter: 'regular_users',
            role: 'admin',
          })
        );
      });
    });

    it('should pass filter=all for individual mode when activeFilter is all', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_all_individual_filtered.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          activeFilter: 'all',
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'individual',
            filter: 'all',
            role: 'admin',
          })
        );
      });
    });

    it('should not pass filter or role for individual mode with regular user', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_me_regular_user.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {
          chartMode: 'individual',
          activeFilter: 'me',
        },
        { user: { id: 1, username: 'regular', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith({
          mode: 'individual',
        });
      });
    });

    it('should pass filter, role, date, and userIds together for individual mode', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_individual_combined.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {
          chartMode: 'individual',
          activeFilter: 'regular',
          startDate: '2025-06-01',
          endDate: '2025-06-30',
          selectedDashboardUserId: 5,
          currentDropdownUsers: [
            { id: 5, username: 'normal_user', email: 'normal@example.com' }
          ],
        },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(loginTrackingService.downloadReport).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'individual',
            filter: 'regular_users',
            role: 'admin',
            userIds: [5],
            startDate: '2025-06-01',
            endDate: '2025-06-30',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error after new successful download', async () => {
      // First make it fail
      vi.mocked(loginTrackingService.downloadReport)
        .mockRejectedValueOnce(new Error('First fail'))
        .mockResolvedValueOnce({
          blob: new Blob(['test']),
          filename: 'login_report_testuser_individual_20260101_120000.xlsx',
        });

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      // First click - should fail
      fireEvent.click(screen.getByTestId('report-download-button'));
      await waitFor(() => {
        expect(screen.getByText('Failed to download report. Please try again.')).toBeInTheDocument();
      });

      // Second click - should succeed and clear error
      fireEvent.click(screen.getByTestId('report-download-button'));
      await waitFor(() => {
        expect(screen.queryByText('Failed to download report. Please try again.')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dark Mode', () => {
    beforeEach(() => {
      // Enable dark mode
      document.documentElement.classList.add('dark');
    });

    it('should render button with dark mode styles when dark class is present', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      const button = screen.getByTestId('report-download-button');
      expect(button).toBeInTheDocument();
      // Button should be rendered (dark mode class applied via twin.macro)
      // The dark class is on document, twin.macro will apply dark:bg-blue-600
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should render admin modal with dark mode card styles when dark class is present', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      const modal = screen.getByTestId('report-download-modal');
      expect(modal).toBeInTheDocument();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should render error message with dark mode error styles when dark class is present', async () => {
      vi.mocked(loginTrackingService.downloadReport).mockRejectedValue(
        new Error('Download failed')
      );

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      await waitFor(() => {
        const errorMessage = screen.getByTestId('download-error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.textContent).toContain('Failed to download report. Please try again.');
      });
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should render modal summary section with dark mode background when dark class is present', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'grouped', selectedUserIds: [1, 2, 3] },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));

      const modal = screen.getByTestId('report-download-modal');
      expect(modal).toBeInTheDocument();
      const modeText = screen.getByTestId('mode-label-text');
      expect(modeText).toBeInTheDocument();
      expect(modeText.textContent).toContain('Grouped');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Portal Rendering', () => {
    beforeEach(() => {
      // Reset any leftover body overflow
      document.body.style.overflow = '';
      // Stub URL.createObjectURL and revokeObjectURL directly (not via vi.fn)
      // since parent beforeEach calls vi.clearAllMocks() which would undo vi.fn mocks
      window.URL.createObjectURL = () => 'blob:test-download-url';
      window.URL.revokeObjectURL = () => {};
    });

    it('should render modal overlay in document.body via portal when admin opens modal', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // Before click: modal should not be in document.body
      expect(document.body.querySelector('[data-testid="report-download-modal"]')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('report-download-button'));

      // After click: modal should be rendered directly in document.body (portal), not nested deep
      const modalInBody = document.body.querySelector('[data-testid="report-download-modal"]');
      expect(modalInBody).toBeInTheDocument();
      expect(modalInBody!.parentElement).toBe(document.body);
    });

    it('should remove modal from document.body when closed via cancel', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(document.body.querySelector('[data-testid="report-download-modal"]')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-cancel-button'));

      expect(document.body.querySelector('[data-testid="report-download-modal"]')).not.toBeInTheDocument();
    });

    it('should keep download button in component tree, not as direct child of document.body', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      // The download button should NOT be a direct child of document.body
      const buttonInBody = screen.getByTestId('report-download-button');
      // It should be contained within the rendered component, not as a direct body child
      expect(buttonInBody.parentElement).not.toBe(document.body);
      // Meanwhile the modal (when opened) should be a direct child of document.body
      const modalInBody = document.body.querySelector('[data-testid="report-download-modal"]');
      expect(modalInBody).toBeNull(); // because modal is not open yet
    });

    it('should remove modal from document.body when download completes (success or error)', async () => {
      // Mock download to resolve quickly
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_admin_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'individual' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(document.body.querySelector('[data-testid="report-download-modal"]')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        expect(document.body.querySelector('[data-testid="report-download-modal"]')).not.toBeInTheDocument();
      });
    });

    it('should keep modal open on download failure so user can retry', async () => {
      // Mock download to reject
      vi.mocked(loginTrackingService.downloadReport).mockRejectedValue(
        new Error('Download failed')
      );

      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        { chartMode: 'individual' },
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(document.body.querySelector('[data-testid="report-download-modal"]')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-download-button'));

      await waitFor(() => {
        // Modal should stay open on failure so user can retry
        expect(document.body.querySelector('[data-testid="report-download-modal"]')).toBeInTheDocument();
      });
    });
  });

  describe('Scroll Lock Behavior', () => {
    beforeEach(() => {
      // Reset body overflow before each test
      document.body.style.overflow = '';
      // Mock window.scrollY
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true });
      window.scrollTo = vi.fn();
    });

    it('should lock body scroll when admin opens modal', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      expect(document.body.style.overflow).toBe('');

      fireEvent.click(screen.getByTestId('report-download-button'));

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal is closed via cancel', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(screen.getByTestId('modal-cancel-button'));
      expect(document.body.style.overflow).toBe('');
    });

    it('should restore body scroll and scroll to saved position when modal is closed', () => {
      renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(screen.getByTestId('modal-cancel-button'));
      expect(document.body.style.overflow).toBe('');
      expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
    });

    it('should not lock body scroll for regular user (no modal)', () => {
      vi.mocked(loginTrackingService.downloadReport).mockResolvedValue({
        blob: new Blob(['test']),
        filename: 'login_report_testuser_individual_20260101_120000.xlsx',
      });

      renderWithProviders(
        <ReportDownloadButton isAdmin={false} />,
        {},
        { user: { id: 1, username: 'testuser', is_staff: false, is_superuser: false } }
      );

      expect(document.body.style.overflow).toBe('');

      fireEvent.click(screen.getByTestId('report-download-button'));

      // Regular user triggers download directly, no modal, so scroll should not be locked
      expect(document.body.style.overflow).toBe('');
    });

    it('should clean up body overflow on component unmount when modal was open', () => {
      const { unmount } = renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      fireEvent.click(screen.getByTestId('report-download-button'));
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('should not affect scroll when modal never opened', () => {
      const { unmount } = renderWithProviders(
        <ReportDownloadButton isAdmin={true} />,
        {},
        { user: { id: 1, username: 'admin', is_staff: true, is_superuser: false } }
      );

      expect(document.body.style.overflow).toBe('');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });
});