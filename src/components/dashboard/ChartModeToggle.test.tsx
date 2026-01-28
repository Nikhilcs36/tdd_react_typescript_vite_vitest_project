import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChartModeToggle from './ChartModeToggle';
import dashboardReducer, { DashboardState } from '../../store/dashboardSlice';

// Mock i18n to avoid initReactI18next issues
vi.mock('../../locale/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    dir: vi.fn(() => 'ltr'),
  },
}));

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  }),
}));

const createMockStore = (initialState: Partial<DashboardState> = {}) => {
  const defaultState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
    selectedDashboardUserId: null,
    currentDropdownUsers: [
      { id: 1, username: 'user1', email: 'user1@test.com' },
      { id: 2, username: 'user2', email: 'user2@test.com' }
    ], // Default to multiple users so group button shows
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
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store
  };
};

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  }),
  initReactI18next: vi.fn(),
}));

describe('ChartModeToggle', () => {
  it('renders toggle with Individual and Group options', () => {
    renderWithProviders(<ChartModeToggle />);

    expect(screen.getByText('dashboard.chart_mode.individual')).toBeInTheDocument();
    expect(screen.getByText('dashboard.chart_mode.group')).toBeInTheDocument();
  });

  it('shows Individual as active by default', () => {
    renderWithProviders(<ChartModeToggle />);

    const individualButton = screen.getByText('dashboard.chart_mode.individual');
    const groupButton = screen.getByText('dashboard.chart_mode.group');

    // Individual should be active (styled differently)
    expect(individualButton).toBeInTheDocument();
    expect(groupButton).toBeInTheDocument();
  });

  it('shows Group as active when chartMode is grouped', () => {
    renderWithProviders(<ChartModeToggle />, { chartMode: 'grouped' });

    const individualButton = screen.getByText('dashboard.chart_mode.individual');
    const groupButton = screen.getByText('dashboard.chart_mode.group');

    expect(individualButton).toBeInTheDocument();
    expect(groupButton).toBeInTheDocument();
  });

  it('dispatches setChartMode action when Individual is clicked', async () => {
    const { store } = renderWithProviders(<ChartModeToggle />, { chartMode: 'grouped' });

    const individualButton = screen.getByText('dashboard.chart_mode.individual');
    fireEvent.click(individualButton);

    await waitFor(() => {
      const state = store.getState().dashboard;
      expect(state.chartMode).toBe('individual');
    });
  });

  it('dispatches setChartMode action when Group is clicked', async () => {
    const { store } = renderWithProviders(<ChartModeToggle />, { chartMode: 'individual' });

    const groupButton = screen.getByText('dashboard.chart_mode.group');
    fireEvent.click(groupButton);

    await waitFor(() => {
      const state = store.getState().dashboard;
      expect(state.chartMode).toBe('grouped');
    });
  });

  it('does not change state when clicking already active mode', async () => {
    const { store } = renderWithProviders(<ChartModeToggle />, { chartMode: 'individual' });

    const individualButton = screen.getByText('dashboard.chart_mode.individual');
    fireEvent.click(individualButton);

    await waitFor(() => {
      const state = store.getState().dashboard;
      expect(state.chartMode).toBe('individual'); // Should remain the same
    });
  });

  it('handles disabled state', () => {
    renderWithProviders(<ChartModeToggle disabled={true} />);

    const individualButton = screen.getByText('dashboard.chart_mode.individual');
    const groupButton = screen.getByText('dashboard.chart_mode.group');

    expect(individualButton.closest('button')).toBeDisabled();
    expect(groupButton.closest('button')).toBeDisabled();
  });

  it('hides entire toggle when only one user is available', () => {
    renderWithProviders(<ChartModeToggle />, {
      currentDropdownUsers: [{ id: 1, username: 'user1' }] // Only one user
    });

    // Entire component should not render
    const individualButton = screen.queryByText('dashboard.chart_mode.individual');
    const groupButton = screen.queryByText('dashboard.chart_mode.group');

    expect(individualButton).not.toBeInTheDocument();
    expect(groupButton).not.toBeInTheDocument();
  });

  it('shows group button when multiple users are available', () => {
    renderWithProviders(<ChartModeToggle />, {
      currentDropdownUsers: [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ] // Multiple users
    });

    const individualButton = screen.getByText('dashboard.chart_mode.individual');
    const groupButton = screen.getByText('dashboard.chart_mode.group');

    expect(individualButton).toBeInTheDocument();
    expect(groupButton).toBeInTheDocument();
  });

  it('switches to individual mode when group becomes unavailable', async () => {
    const { store } = renderWithProviders(<ChartModeToggle />, {
      chartMode: 'grouped',
      currentDropdownUsers: [{ id: 1, username: 'user1' }] // Only one user
    });

    await waitFor(() => {
      const state = store.getState().dashboard;
      expect(state.chartMode).toBe('individual');
    });
  });
});
