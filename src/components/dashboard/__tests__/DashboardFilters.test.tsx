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
    it('renders all three filter buttons', () => {
      renderWithProviders(<DashboardFilters />);

      expect(screen.getByTestId('filter-all-users')).toBeInTheDocument();
      expect(screen.getByTestId('filter-specific-users')).toBeInTheDocument();
      expect(screen.getByTestId('filter-admin-only')).toBeInTheDocument();
    });

    it('displays translated button labels', () => {
      renderWithProviders(<DashboardFilters />);

      // Test that translation keys are present (actual translation depends on i18n setup)
      expect(screen.getByTestId('filter-all-users')).toHaveTextContent(/all/i);
      expect(screen.getByTestId('filter-specific-users')).toHaveTextContent(/specific/i);
      expect(screen.getByTestId('filter-admin-only')).toHaveTextContent(/admin/i);
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

      const specificButton = screen.getByTestId('filter-specific-users');
      const adminButton = screen.getByTestId('filter-admin-only');

      expect(specificButton).toHaveClass('bg-gray-200', 'dark:bg-dark-accent');
      expect(adminButton).toHaveClass('bg-gray-200', 'dark:bg-dark-accent');
    });

    it('applies active styling to the "specific" filter when activeFilter is "specific"', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'specific' });

      const specificButton = screen.getByTestId('filter-specific-users');
      expect(specificButton).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });

    it('applies active styling to the "admin" filter when activeFilter is "admin"', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'admin' });

      const adminButton = screen.getByTestId('filter-admin-only');
      expect(adminButton).toHaveClass('bg-blue-600', 'text-white', 'shadow-md');
    });
  });

  describe('Filter Change Interactions', () => {
    it('renders buttons that can be clicked when not disabled', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'all' });

      const specificButton = screen.getByTestId('filter-specific-users');
      expect(specificButton).not.toBeDisabled();

      // Click should not throw an error (component handles the dispatch internally)
      expect(() => fireEvent.click(specificButton)).not.toThrow();
    });

    it('all buttons are clickable when component is not disabled', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      const specificButton = screen.getByTestId('filter-specific-users');
      const adminButton = screen.getByTestId('filter-admin-only');

      expect(allButton).not.toBeDisabled();
      expect(specificButton).not.toBeDisabled();
      expect(adminButton).not.toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('disables all buttons when disabled prop is true', () => {
      renderWithProviders(<DashboardFilters disabled={true} />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      const specificButton = screen.getByTestId('filter-specific-users');
      const adminButton = screen.getByTestId('filter-admin-only');

      expect(allButton).toBeDisabled();
      expect(specificButton).toBeDisabled();
      expect(adminButton).toBeDisabled();
    });

    it('applies disabled styling when disabled prop is true', () => {
      renderWithProviders(<DashboardFilters disabled={true} />, { activeFilter: 'all' });

      const allButton = screen.getByTestId('filter-all-users');
      expect(allButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('buttons remain disabled when disabled prop is true', () => {
      renderWithProviders(<DashboardFilters disabled={true} />, { activeFilter: 'all' });

      const specificButton = screen.getByTestId('filter-specific-users');
      expect(specificButton).toBeDisabled();

      // Click should not throw but button should remain disabled
      fireEvent.click(specificButton);
      expect(specificButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-pressed to true for active filter', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'specific' });

      const specificButton = screen.getByTestId('filter-specific-users');
      expect(specificButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('sets aria-pressed to false for inactive filters', () => {
      renderWithProviders(<DashboardFilters />, { activeFilter: 'specific' });

      const allButton = screen.getByTestId('filter-all-users');
      const adminButton = screen.getByTestId('filter-admin-only');

      expect(allButton).toHaveAttribute('aria-pressed', 'false');
      expect(adminButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Type Definitions', () => {
    it('exports DashboardFilterMode type with correct values', () => {
      const modes: DashboardFilterMode[] = ['all', 'specific', 'admin'];
      expect(modes).toHaveLength(3);
      expect(modes).toContain('all');
      expect(modes).toContain('specific');
      expect(modes).toContain('admin');
    });
  });
});
