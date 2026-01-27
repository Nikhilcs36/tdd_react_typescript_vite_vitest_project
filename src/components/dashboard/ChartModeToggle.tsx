import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setChartMode } from '../../store/dashboardSlice';
import tw from 'twin.macro';

interface ChartModeToggleProps {
  disabled?: boolean;
}

const ToggleContainer = tw.div`flex items-center space-x-2 mb-4`;
const ToggleButton = tw.button`
  px-4 py-2 rounded-lg font-medium transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
`;

/**
 * ChartModeToggle Component
 * Allows switching between Individual and Group chart modes
 * Individual: Shows charts for selected dropdown user
 * Group: Shows aggregated charts for selected users or all users
 */
const ChartModeToggle: React.FC<ChartModeToggleProps> = ({
  disabled = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Get current chart mode and dropdown users from Redux state
  const chartMode = useSelector((state: RootState) => state.dashboard.chartMode);
  const currentDropdownUsers = useSelector((state: RootState) => state.dashboard.currentDropdownUsers);

  // Auto-switch to individual mode if group is selected but not available
  useEffect(() => {
    if (chartMode === 'grouped' && currentDropdownUsers.length <= 1) {
      dispatch(setChartMode('individual'));
    }
  }, [chartMode, currentDropdownUsers.length, dispatch]);

  // Show group button only when multiple users are available
  const showGroupButton = currentDropdownUsers.length > 1;

  const handleModeChange = (mode: 'individual' | 'grouped') => {
    if (!disabled && mode !== chartMode) {
      dispatch(setChartMode(mode));
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
    <ToggleContainer>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('dashboard.chart_mode.label')}:
      </span>

      <ToggleButton
        className={getButtonClasses(chartMode === 'individual')}
        onClick={() => handleModeChange('individual')}
        disabled={disabled}
        data-testid="chart-mode-individual"
      >
        {t('dashboard.chart_mode.individual')}
      </ToggleButton>

      {showGroupButton && (
        <ToggleButton
          className={getButtonClasses(chartMode === 'grouped')}
          onClick={() => handleModeChange('grouped')}
          disabled={disabled}
          data-testid="chart-mode-group"
        >
          {t('dashboard.chart_mode.group')}
        </ToggleButton>
      )}
    </ToggleContainer>
  );
};

export default ChartModeToggle;
