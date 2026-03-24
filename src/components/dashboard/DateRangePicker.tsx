import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setDateRange, setDatePreset } from '../../store/dashboardSlice';
import { DatePreset } from '../../store/dashboardSlice';
import { getDateRangeFromPreset } from '../../utils/dateUtils';
import tw from 'twin.macro';

interface DateRangePickerProps {
  disabled?: boolean;
}

const FilterContainer = tw.div`bg-white dark:bg-dark-secondary rounded-lg p-4 mb-6 shadow-sm border border-gray-200 dark:border-dark-accent`;
const Title = tw.h3`text-lg font-semibold mb-3 text-gray-900 dark:text-dark-text`;
const ButtonGroup = tw.div`flex flex-wrap gap-2 mb-3`;
const PresetButton = tw.button`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;
const ActiveButton = tw(PresetButton)`bg-blue-500 text-white hover:bg-blue-600`;
const InactiveButton = tw(PresetButton)`bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-dark-accent dark:text-dark-text dark:hover:bg-gray-600`;
const DateRangeContainer = tw.div`flex gap-4 items-center`;
const DateInput = tw.input`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-primary dark:border-dark-accent dark:text-dark-text`;
const Label = tw.label`text-sm font-medium text-gray-700 dark:text-gray-300`;
const ClearButton = tw.button`px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-accent dark:hover:bg-dark-secondary`;
const Description = tw.p`text-sm text-gray-600 dark:text-gray-400 mt-2`;

const PRESET_CONFIG = {
  '30days': { labelKey: 'dashboard.dateRange.last30Days', descriptionKey: 'dashboard.dateRange.showingLast30Days' },
  '7days': { labelKey: 'dashboard.dateRange.last7Days', descriptionKey: 'dashboard.dateRange.showingLast7Days' },
  '1day': { labelKey: 'dashboard.dateRange.last1Day', descriptionKey: 'dashboard.dateRange.showingLast1Day' },
  'custom': { labelKey: 'dashboard.dateRange.custom', descriptionKey: 'dashboard.dateRange.showingCustomRange' },
} as const;

/**
 * DateRangePicker Component
 * Provides date range selection controls with preset options for dashboard filtering
 * Integrates with Redux state for unified date management across all dashboard components
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({ disabled = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const datePreset = useSelector((state: RootState) => state.dashboard.datePreset);
  const startDate = useSelector((state: RootState) => state.dashboard.startDate);
  const endDate = useSelector((state: RootState) => state.dashboard.endDate);

  // Calculate initial dates for presets when dates are null
  useEffect(() => {
    if (disabled) return;
    
    // Only calculate dates for non-custom presets when BOTH dates are null
    if (datePreset !== 'custom' && startDate === null && endDate === null) {
      const dateRange = getDateRangeFromPreset(datePreset);
      dispatch(setDateRange(dateRange));
    }
  }, [datePreset, startDate, endDate, disabled, dispatch]);

  const handlePresetChange = (preset: DatePreset) => {
    if (disabled) return;

    dispatch(setDatePreset(preset));

    if (preset !== 'custom') {
      const dateRange = getDateRangeFromPreset(preset);
      dispatch(setDateRange(dateRange));
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value || null;
    
    // If we're not already on custom preset, switch to it when manually changing dates
    if (datePreset !== 'custom') {
      dispatch(setDatePreset('custom'));
    }
    
    dispatch(setDateRange({ startDate: newStartDate, endDate }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value || null;
    
    // If we're not already on custom preset, switch to it when manually changing dates
    if (datePreset !== 'custom') {
      dispatch(setDatePreset('custom'));
    }
    
    dispatch(setDateRange({ startDate, endDate: newEndDate }));
  };

  const handleClearDates = () => {
    dispatch(setDateRange({ startDate: null, endDate: null }));
  };

  const getCurrentDescription = () => {
    const config = PRESET_CONFIG[datePreset];
    return config ? t(config.descriptionKey) : t('dashboard.dateRange.showingLast30Days');
  };

  const hasDates = startDate || endDate;

  return (
    <FilterContainer data-testid="date-range-picker">
      <Title data-testid="date-range-picker-title">{t('dashboard.dateRange.title')}</Title>

      <ButtonGroup>
        {(Object.keys(PRESET_CONFIG) as DatePreset[]).map((preset) => {
          const config = PRESET_CONFIG[preset];
          const isActive = datePreset === preset;
          const ButtonComponent = isActive ? ActiveButton : InactiveButton;

          return (
            <ButtonComponent
              key={preset}
              onClick={() => handlePresetChange(preset)}
              disabled={disabled}
              data-testid={`preset-${preset}`}
              data-active={isActive ? 'true' : 'false'}
              type="button"
            >
              {t(config.labelKey)}
            </ButtonComponent>
          );
        })}
      </ButtonGroup>

      <DateRangeContainer>
        <div className="flex flex-col gap-1">
          <Label htmlFor="start-date">{t('dashboard.dateRange.startDate')}</Label>
          <DateInput
            id="start-date"
            type="date"
            value={startDate || ''}
            onChange={handleStartDateChange}
            disabled={disabled}
            data-testid="start-date-input"
            max={endDate || undefined}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="end-date">{t('dashboard.dateRange.endDate')}</Label>
          <DateInput
            id="end-date"
            type="date"
            value={endDate || ''}
            onChange={handleEndDateChange}
            disabled={disabled}
            data-testid="end-date-input"
            min={startDate || undefined}
          />
        </div>

        {hasDates && (
          <ClearButton
            onClick={handleClearDates}
            disabled={disabled}
            data-testid="clear-dates-button"
            type="button"
          >
            {t('dashboard.dateRange.clear')}
          </ClearButton>
        )}
      </DateRangeContainer>

      <Description data-testid="date-range-description">
        {getCurrentDescription()}
      </Description>
    </FilterContainer>
  );
};

export default DateRangePicker;