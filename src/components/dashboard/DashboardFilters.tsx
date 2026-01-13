import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setActiveFilter } from '../../store/dashboardSlice';
import tw from 'twin.macro';

export type DashboardFilterMode = 'all' | 'specific' | 'admin';

interface DashboardFiltersProps {
  disabled?: boolean;
}

const FilterContainer = tw.div`flex gap-2 mb-6`;
const FilterButton = tw.button`
  px-4 py-2 rounded-lg font-medium transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
`;

/**
 * DashboardFilters Component
 * Provides filter controls for dashboard data context
 * Supports three modes: all users, specific users, admin only
 * Uses Redux state for filter management
 */
const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  disabled = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Get active filter from Redux state
  const activeFilter = useSelector((state: RootState) => state.dashboard.activeFilter);

  const handleFilterClick = (filter: DashboardFilterMode) => {
    if (!disabled && filter !== activeFilter) {
      dispatch(setActiveFilter(filter));
    }
  };

  const getButtonClasses = (isActive: boolean) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
    const activeClasses = isActive
      ? 'bg-blue-600 text-white shadow-md'
      : 'bg-gray-200 dark:bg-dark-accent text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-secondary';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${activeClasses} ${disabledClasses}`;
  };

  return (
    <div data-testid="dashboard-filters">
      <FilterContainer>
        <FilterButton
          className={getButtonClasses(activeFilter === 'all')}
          onClick={() => handleFilterClick('all')}
          disabled={disabled}
          data-testid="filter-all-users"
          aria-pressed={activeFilter === 'all'}
        >
          {t('dashboard.filters.allUsers')}
        </FilterButton>

        <FilterButton
          className={getButtonClasses(activeFilter === 'specific')}
          onClick={() => handleFilterClick('specific')}
          disabled={disabled}
          data-testid="filter-specific-users"
          aria-pressed={activeFilter === 'specific'}
        >
          {t('dashboard.filters.specificUsers')}
        </FilterButton>

        <FilterButton
          className={getButtonClasses(activeFilter === 'admin')}
          onClick={() => handleFilterClick('admin')}
          disabled={disabled}
          data-testid="filter-admin-only"
          aria-pressed={activeFilter === 'admin'}
        >
          {t('dashboard.filters.adminOnly')}
        </FilterButton>
      </FilterContainer>
    </div>
  );
};

export default DashboardFilters;
