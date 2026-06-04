import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import tw from 'twin.macro';
import { RootState } from '../../store';
import { downloadReport, DownloadReportResult } from '../../services/loginTrackingService';

interface ReportDownloadButtonProps {
  isAdmin: boolean;
}

// Styled components with dark mode support
const DownloadButton = tw.button`
  inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
  bg-blue-500 hover:bg-blue-600
  dark:bg-blue-600 dark:hover:bg-blue-700
  rounded-lg border-none cursor-pointer
  transition-colors duration-200
  disabled:bg-gray-400 disabled:cursor-not-allowed
  dark:disabled:bg-gray-600
`;

const ErrorBox = tw.div`
  mt-2 px-3 py-2 text-sm rounded-lg
  bg-red-50 border border-red-200 text-red-700
  dark:bg-red-900/20 dark:border-red-700 dark:text-red-300
`;

const ModalOverlay = tw.div`
  fixed inset-0 bg-black/50 backdrop-blur-sm
  flex items-center justify-center z-50
`;

const ModalCard = tw.div`
  bg-white dark:bg-dark-secondary
  rounded-xl p-6 max-w-md w-11/12
  shadow-lg border border-gray-100 dark:border-dark-accent
`;

const ModalTitle = tw.h3`
  m-0 text-lg font-bold text-gray-900 dark:text-dark-text
  mb-1
`;

const ModalSubtitle = tw.p`
  m-0 mb-5 text-sm text-gray-500 dark:text-gray-400
`;

const SummaryBox = tw.div`
  bg-gray-50 dark:bg-dark-accent
  rounded-lg p-4 mb-5
  border border-gray-200 dark:border-dark-accent
`;

const SummaryLabel = tw.div`
  text-xs font-medium text-gray-500 dark:text-gray-400 mb-2
`;

const SummaryContent = tw.div`
  text-xs text-gray-600 dark:text-gray-400 leading-relaxed
`;

const SummaryItem = tw.div``;

const ModalActions = tw.div`
  flex gap-3 justify-end
`;

const CancelButton = tw.button`
  px-5 py-2.5 text-sm font-medium rounded-lg
  bg-gray-100 text-gray-700 border border-gray-200
  dark:bg-dark-accent dark:text-gray-300 dark:border-dark-accent
  cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-secondary
  disabled:cursor-not-allowed disabled:opacity-50
  transition-colors duration-200
`;

const DownloadActionButton = tw.button`
  inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white
  bg-green-500 hover:bg-green-600
  dark:bg-green-600 dark:hover:bg-green-700
  rounded-lg border-none cursor-pointer
  disabled:bg-gray-400 disabled:cursor-not-allowed
  dark:disabled:bg-gray-600
  transition-colors duration-200
`;

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/**
 * ReportDownloadButton Component
 * 
 * For regular users: Downloads report directly in individual mode (no modal)
 * For admin users: Shows a confirmation modal with readonly mode info from dashboard state
 * 
 * The download mode (individual/grouped) is driven by dashboardState.chartMode
 * which is set by the ChartModeToggle component in the dashboard.
 * 
 * When an admin selects a dropdown user (selectedDashboardUserId) in individual mode,
 * the user_ids[] parameter is sent to the backend so the report shows that user's data.
 * 
 * Supports dark/light theme via twin.macro dark: variants.
 */
const ReportDownloadButton: React.FC<ReportDownloadButtonProps> = ({ isAdmin }) => {
  const { t } = useTranslation();
  const dashboardState = useSelector((state: RootState) => state.dashboard);
  
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  /**
   * Trigger the file download in the browser
   */
  const triggerDownload = useCallback((result: DownloadReportResult) => {
    const url = window.URL.createObjectURL(new Blob([result.blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  /**
   * Find the selected dropdown user's name from currentDropdownUsers
   */
  const getSelectedUserLabel = useCallback((): string | null => {
    const { selectedDashboardUserId, currentDropdownUsers } = dashboardState;
    if (!selectedDashboardUserId || !currentDropdownUsers.length) return null;
    const user = currentDropdownUsers.find(u => u.id === selectedDashboardUserId);
    return user ? user.username : null;
  }, [dashboardState]);

  const authState = useSelector((state: RootState) => state.auth);

  /**
   * Map activeFilter from dashboard state to backend filter parameter
   */
  const getFilterParam = useCallback((): 'all' | 'admin_only' | 'regular_users' | 'me' | undefined => {
    switch (dashboardState.activeFilter) {
      case 'admin':
        return 'admin_only';
      case 'regular':
        return 'regular_users';
      case 'me':
        return 'me';
      case 'all':
        return 'all';
      default:
        return undefined;
    }
  }, [dashboardState.activeFilter]);

  /**
   * Get role parameter from auth user's actual role
   */
  const getRoleParam = useCallback((): 'admin' | 'regular' | undefined => {
    const user = authState.user;
    if (!user) return undefined;
    if (user.is_staff || user.is_superuser) {
      return 'admin';
    }
    return 'regular';
  }, [authState.user]);

  /**
   * Execute the download using mode from dashboard state
   */
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);

    const mode = dashboardState.chartMode;

    // Build userIds and selectedUserId for the API call:
    // - Individual mode: send only the dropdown-selected user (no selectedUserId needed)
    // - Grouped mode: send all dropdown users for grouped chart data, plus selectedUserId
    //   so the backend knows which user to label as "Selected User"
    let userIds: number[] | undefined;
    let selectedUserId: number | undefined;

    if (mode === 'individual' && dashboardState.selectedDashboardUserId !== null) {
      userIds = [dashboardState.selectedDashboardUserId];
    } else if (mode === 'grouped') {
      const allDropdownUserIds = dashboardState.currentDropdownUsers.map(u => u.id);
      if (allDropdownUserIds.length > 0) {
        userIds = allDropdownUserIds;
        if (dashboardState.selectedDashboardUserId !== null) {
          selectedUserId = dashboardState.selectedDashboardUserId;
        }
      }
    }

    try {
      const params: Parameters<typeof downloadReport>[0] = {
        mode,
        userIds,
        startDate: dashboardState.startDate || undefined,
        endDate: dashboardState.endDate || undefined,
        ...(isAdmin && { filter: getFilterParam(), role: getRoleParam() }),
      };
      // Only include selectedUserId when defined (not needed for individual mode)
      if (selectedUserId !== undefined) {
        params.selectedUserId = selectedUserId;
      }
      const result = await downloadReport(params);
      
      triggerDownload(result);
      setShowModal(false);
    } catch (_error) {
      const errorMessage = t('dashboard.report_download.file_error');
      setDownloadError(errorMessage);
    } finally {
      setDownloading(false);
    }
  }, [dashboardState, t, triggerDownload, getFilterParam, getRoleParam, isAdmin]);

  /**
   * Handle button click based on user role
   */
  const onButtonClick = useCallback(() => {
    if (isAdmin) {
      setShowModal(true);
    } else {
      handleDownload();
    }
  }, [isAdmin, handleDownload]);

  /**
   * Close the modal
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const mode = dashboardState.chartMode;
  const selectedUserLabel = getSelectedUserLabel();

  return (
    <div>
      {/* Download Button */}
      <DownloadButton
        data-testid="report-download-button"
        onClick={onButtonClick}
        disabled={downloading}
      >
        <DownloadIcon />
        {downloading ? t('dashboard.report_download.downloading') : t('dashboard.report_download.button')}
      </DownloadButton>

      {/* Error Message */}
      {downloadError && (
        <ErrorBox data-testid="download-error-message">
          {downloadError}
        </ErrorBox>
      )}

      {/* Admin Modal */}
      {showModal && (
        <ModalOverlay
          data-testid="report-download-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <ModalCard>
            {/* Modal Header */}
            <ModalTitle>
              {t('dashboard.report_download.confirm_title')}
            </ModalTitle>
            <ModalSubtitle>
              {t('dashboard.report_download.confirm_summary')}
            </ModalSubtitle>

            {/* Readonly Summary Info */}
            <SummaryBox>
              <SummaryLabel>
                {t('dashboard.report_download.confirm_summary')}
              </SummaryLabel>
              <SummaryContent>
                <SummaryItem data-testid="mode-label-text">
                  • <span>{t('dashboard.report_download.mode_label')}</span>: {mode === 'individual' ? t('dashboard.report_download.individual') : t('dashboard.report_download.grouped')}
                </SummaryItem>
                {dashboardState.startDate && dashboardState.endDate && (
                  <SummaryItem>
                    • {t('dashboard.dateRange.title')}: {dashboardState.startDate} ~ {dashboardState.endDate}
                  </SummaryItem>
                )}
                {mode === 'grouped' && dashboardState.selectedUserIds.length > 0 && (
                  <SummaryItem>
                    • {t('dashboard.user_selector.label')}: {dashboardState.selectedUserIds.length} users
                  </SummaryItem>
                )}
                {mode === 'individual' && selectedUserLabel && (
                  <SummaryItem>
                    • {t('dashboard.user_selector.selected')}: {selectedUserLabel}
                  </SummaryItem>
                )}
              </SummaryContent>
            </SummaryBox>

            {/* Action Buttons */}
            <ModalActions>
              <CancelButton
                data-testid="modal-cancel-button"
                onClick={closeModal}
                disabled={downloading}
              >
                {t('dashboard.report_download.cancel')}
              </CancelButton>
              <DownloadActionButton
                data-testid="modal-download-button"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? t('dashboard.report_download.downloading') : t('dashboard.report_download.download')}
              </DownloadActionButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </div>
  );
};

export default ReportDownloadButton;