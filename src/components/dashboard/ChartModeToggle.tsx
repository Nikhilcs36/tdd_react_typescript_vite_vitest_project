import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setChartMode } from '../../store/dashboardSlice';
import {
  ToggleContainer,
  ToggleButtonsContainer,
  ModeLabel,
  DateRangeLabel,
  ToggleButton,
  PlaceholderContainer
} from './ChartModeToggle.styles';

interface ChartModeToggleProps {
  disabled?: boolean;
  dateRangeLabel?: string;
}

/**
 * ChartModeToggle Component
 * Allows switching between Individual and Group chart modes
 * Individual: Shows charts for selected dropdown user
 * Group: Shows aggregated charts for selected users or all users
 */
const ChartModeToggle: React.FC<ChartModeToggleProps> = ({
  disabled = false,
  dateRangeLabel,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Get current chart mode and dropdown users from Redux state
  const chartMode = useSelector((state: RootState) => state.dashboard.chartMode);
  const currentDropdownUsers = useSelector((state: RootState) => state.dashboard.currentDropdownUsers);

  // Auto-switch to individual mode if group is selected but not available
  // This runs even when the toggle is hidden to ensure correct data fetching
  useEffect(() => {
    if (chartMode === 'grouped' && currentDropdownUsers.length <= 1) {
      dispatch(setChartMode('individual'));
    }
  }, [chartMode, currentDropdownUsers.length, dispatch]);

  // Show placeholder when only one or no users are available to maintain consistent height
  if (currentDropdownUsers.length <= 1) {
    return (
      <PlaceholderContainer data-testid="chart-mode-placeholder">
        {dateRangeLabel && (
          <DateRangeLabel data-testid="date-range-label">
            {dateRangeLabel}
          </DateRangeLabel>
        )}
      </PlaceholderContainer>
    );
  }

  const handleModeChange = (mode: 'individual' | 'grouped') => {
    if (!disabled && mode !== chartMode) {
      dispatch(setChartMode(mode));
    }
  };

  return (
    <ToggleContainer>
      <ToggleButtonsContainer>
        <ModeLabel>
          {t('dashboard.chart_mode.label')}:
        </ModeLabel>

        <ToggleButton
          $isActive={chartMode === 'individual'}
          $disabled={disabled}
          onClick={() => handleModeChange('individual')}
          disabled={disabled}
          data-testid="chart-mode-individual"
        >
          {t('dashboard.chart_mode.individual')}
        </ToggleButton>

        <ToggleButton
          $isActive={chartMode === 'grouped'}
          $disabled={disabled}
          onClick={() => handleModeChange('grouped')}
          disabled={disabled}
          data-testid="chart-mode-group"
        >
          {t('dashboard.chart_mode.group')}
        </ToggleButton>
      </ToggleButtonsContainer>

      {dateRangeLabel && (
        <DateRangeLabel data-testid="date-range-label">
          {dateRangeLabel}
        </DateRangeLabel>
      )}
    </ToggleContainer>
  );
};

export default ChartModeToggle;
