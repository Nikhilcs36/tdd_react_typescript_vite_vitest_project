import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../../locale/i18n';
import DashboardUserList from '../DashboardUserList';
import dashboardReducer, { DashboardState } from '../../../store/dashboardSlice';
import { axiosApiServiceLoadUserList } from '../../../services/apiService';

// Mock the API service
vi.mock('../../../services/apiService', () => ({
  axiosApiServiceLoadUserList: {
    get: vi.fn(),
  },
}));

const createMockStore = (initialState: Partial<DashboardState> = {}) => {
  const defaultState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
    selectedDashboardUserId: null,
    currentDropdownUsers: [],
    chartMode: 'individual',
    startDate: null,
    endDate: null,
    isLoading: false,
    error: null,
    ...initialState,
  };

  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
    },
    preloadedState: {
      dashboard: defaultState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </Provider>
  );
};

const mockGetUsers = vi.mocked(axiosApiServiceLoadUserList.get);

describe('DashboardUserList - Button Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should maintain consistent pagination button alignment on page 1 and page 2', async () => {
    // Mock page 1 response
    const page1Response = {
      count: 6, // 2 pages
      next: 'http://test.com/api/users?page=2',
      previous: null,
      results: [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' },
        { id: 3, username: 'user3', email: 'user3@test.com' },
      ],
    };

    // Mock page 2 response
    const page2Response = {
      count: 6, // 2 pages
      next: null,
      previous: 'http://test.com/api/users?page=1',
      results: [
        { id: 4, username: 'user4', email: 'user4@test.com' },
        { id: 5, username: 'user5', email: 'user5@test.com' },
        { id: 6, username: 'user6', email: 'user6@test.com' },
      ],
    };

    mockGetUsers.mockResolvedValueOnce(page1Response).mockResolvedValueOnce(page2Response);

    const { container } = renderWithProviders(<DashboardUserList />);

    // Wait for page 1 to load
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    // Get pagination container on page 1
    const paginationContainerPage1 = container.querySelector('[data-testid="pagination-container"]');
    expect(paginationContainerPage1).not.toBeNull();

    // Navigate to page 2
    const nextButton = screen.getByTestId('next-button');
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Wait for page 2 to load
    await waitFor(() => {
      expect(screen.getByText('user4')).toBeInTheDocument();
    });

    // Get pagination container on page 2
    const paginationContainerPage2 = container.querySelector('[data-testid="pagination-container"]');
    expect(paginationContainerPage2).not.toBeNull();

    // Verify both pagination containers have the same height to ensure alignment
    const height1 = paginationContainerPage1?.getBoundingClientRect().height;
    const height2 = paginationContainerPage2?.getBoundingClientRect().height;
    expect(height1).toEqual(height2);

    // Verify both pagination containers have the same vertical position
    const top1 = paginationContainerPage1?.getBoundingClientRect().top;
    const top2 = paginationContainerPage2?.getBoundingClientRect().top;
    expect(top1).toEqual(top2);
  });
});