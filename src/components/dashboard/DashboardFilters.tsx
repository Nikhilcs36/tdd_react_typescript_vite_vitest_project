import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setActiveFilter } from '../../store/dashboardSlice';
import { FilterContainer, FilterButton } from './DashboardFilters.styles';

export type DashboardFilterMode = 'all' | 'regular' | 'admin' | 'me';

interface DashboardFiltersProps {
  disabled?: boolean;
}

/**
 * DashboardFilters Component
 * Provides filter controls for dashboard data context
 * Supports four modes: all users, regular users, admin only, me
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

  return (
    <div data-testid="dashboard-filters">
      <FilterContainer>
        <FilterButton
          $isActive={activeFilter === 'all'}
          $disabled={disabled}
          onClick={() => handleFilterClick('all')}
          disabled={disabled}
          data-testid="filter-all-users"
          aria-pressed={activeFilter === 'all'}
        >
          {t('dashboard.filters.allUsers')}
        </FilterButton>

        <FilterButton
          $isActive={activeFilter === 'regular'}
          $disabled={disabled}
          onClick={() => handleFilterClick('regular')}
          disabled={disabled}
          data-testid="filter-regular-users"
          aria-pressed={activeFilter === 'regular'}
        >
          {t('dashboard.filters.regularUsers')}
        </FilterButton>

        <FilterButton
          $isActive={activeFilter === 'admin'}
          $disabled={disabled}
          onClick={() => handleFilterClick('admin')}
          disabled={disabled}
          data-testid="filter-admin-only"
          aria-pressed={activeFilter === 'admin'}
        >
          {t('dashboard.filters.adminOnly')}
        </FilterButton>

        <FilterButton
          $isActive={activeFilter === 'me'}
          $disabled={disabled}
          onClick={() => handleFilterClick('me')}
          disabled={disabled}
          data-testid="filter-me"
          aria-pressed={activeFilter === 'me'}
        >
          {t('dashboard.filters.me')}
        </FilterButton>
      </FilterContainer>
    </div>
  );
};

export default DashboardFilters;
