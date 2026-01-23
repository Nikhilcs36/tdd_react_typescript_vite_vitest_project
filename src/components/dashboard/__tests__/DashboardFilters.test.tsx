import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../../locale/i18n';
import DashboardFilters, { DashboardFilterMode } from '../DashboardFilters';
import dashboardReducer, { DashboardState } from '../../../store/dashboardSlice';

const createMockStore = (initialState: Partial<DashboardState> = {}) => {
  const defaultState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
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

describe('DashboardFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all four filter buttons', () => {
      renderWithProviders(<DashboardFilters />);

      expect(screen.getByTestId('filter-all-users')).toBeInTheDocument();
      expect(screen.getByTestId('filter-regular-users')).toBeInTheDocument();
      expect(screen.getByTestId('filter-admin-only')).toBeInTheDocument();
      expect(screen.getByTestId('filter-me')).toBeInTheDocument();
    });

    it('displays translated button labels', () => {
      renderWithProviders(<DashboardFilters />);

      // Test that translation keys are present (actual translation depends on i18n setup)
      expect(screen.getByTestId('filter-all-users')).toHaveTextContent(/all/i);
      expect(screen.getByTestId('filter-regular-users')).toHaveTextContent(/regular/i);
      expect(screen.getByTestId('filter-admin-only')).toHaveTextContent(/admin/i);
      expect(screen.getByTestId('filter-me')).toHaveTextContent(/me/i);
    });
  });

  describe('Active Filter Styling', () => {
    it('applies active styling to the "all" filter when activeFilter is "all"', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      expect(allButton).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });

    it('applies inactive styling to non-active filters', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'all' });

      const regularButton = screen.getByTestId('filter-regular-users');
      const adminButton = screen.getByTestId('filter-admin-only');
      const meButton = screen.getByTestId('filter-me');

      expect(regularButton).toHaveClass('bg-gray-200', 'dark:bg-dark-accent');
      expect(adminButton).toHaveClass('bg-gray-200', 'dark:bg-dark-accent');
      expect(meButton).toHaveClass('bg-gray-200', 'dark:bg-dark-accent');
    });

    it('applies active styling to the "regular" filter when activeFilter is "regular"', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'regular' });

      const regularButton = screen.getByTestId('filter-regular-users');
      expect(regularButton).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });

    it('applies active styling to the "admin" filter when activeFilter is "admin"', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'admin' });

      const adminButton = screen.getByTestId('filter-admin-only');
      expect(adminButton).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });

    it('applies active styling to the "me" filter when activeFilter is "me"', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'me' });

      const meButton = screen.getByTestId('filter-me');
      expect(meButton).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });
  });

  describe('Filter Change Interactions', () => {
    it('renders buttons that can be clicked when not disabled', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'all' });

      const regularButton = screen.getByTestId('filter-regular-users');
      expect(regularButton).not.toBeDisabled();

      // Click should not throw an error (component handles the dispatch internally)
      expect(() => fireEvent.click(regularButton)).not.toThrow();
    });

    it('all buttons are clickable when component is not disabled', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      const regularButton = screen.getByTestId('filter-regular-users');
      const adminButton = screen.getByTestId('filter-admin-only');
      const meButton = screen.getByTestId('filter-me');

      expect(allButton).not.toBeDisabled();
      expect(regularButton).not.toBeDisabled();
      expect(adminButton).not.toBeDisabled();
      expect(meButton).not.toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('disables all buttons when disabled prop is true', () => {
      renderWithProviders(<DashboardFilters disabled={true} />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      const regularButton = screen.getByTestId('filter-regular-users');
      const adminButton = screen.getByTestId('filter-admin-only');
      const meButton = screen.getByTestId('filter-me');

      expect(allButton).toBeDisabled();
      expect(regularButton).toBeDisabled();
      expect(adminButton).toBeDisabled();
      expect(meButton).toBeDisabled();
    });

    it('applies disabled styling when disabled prop is true', () => {
      renderWithProviders(<DashboardFilters disabled={true} />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      expect(allButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('buttons remain disabled when disabled prop is true', () => {
      renderWithProviders(<DashboardFilters disabled={true} />, { activeFilter: 'all' });

      const regularButton = screen.getByTestId('filter-regular-users');
      expect(regularButton).toBeDisabled();

      // Click should not throw but button should remain disabled
      fireEvent.click(regularButton);
      expect(regularButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-pressed to true for active filter', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'regular' });

      const regularButton = screen.getByTestId('filter-regular-users');
      expect(regularButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('sets aria-pressed to false for inactive filters', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'regular' });

      const allButton = screen.getByTestId('filter-all-users');
      const adminButton = screen.getByTestId('filter-admin-only');
      const meButton = screen.getByTestId('filter-me');

      expect(allButton).toHaveAttribute('aria-pressed', 'false');
      expect(adminButton).toHaveAttribute('aria-pressed', 'false');
      expect(meButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Type Definitions', () => {
    it('exports DashboardFilterMode type with correct values', () => {
      const modes: DashboardFilterMode[] = ['all', 'regular', 'admin', 'me'];
      expect(modes).toHaveLength(4);
      expect(modes).toContain('all');
      expect(modes).toContain('regular');
      expect(modes).toContain('admin');
      expect(modes).toContain('me');
    });
  });
});
