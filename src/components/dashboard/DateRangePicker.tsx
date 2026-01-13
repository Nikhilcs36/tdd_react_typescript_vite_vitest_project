import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setDateRange } from '../../store/dashboardSlice';
import tw from 'twin.macro';

interface DateRangePickerProps {
  disabled?: boolean;
}

const DateRangeContainer = tw.div`flex gap-4 items-center mb-6`;
const DateInput = tw.input`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-secondary dark:border-dark-accent dark:text-dark-text`;
const Label = tw.label`text-sm font-medium text-gray-700 dark:text-gray-300`;
const ClearButton = tw.button`px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-accent dark:hover:bg-dark-secondary`;

/**
 * DateRangePicker Component
 * Provides date range selection controls for dashboard filtering
 * Integrates with Redux state for date range management
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({ disabled = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Get date range from Redux state
  const startDate = useSelector((state: RootState) => state.dashboard.startDate);
  const endDate = useSelector((state: RootState) => state.dashboard.endDate);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value || null;
    dispatch(setDateRange({ startDate: newStartDate, endDate }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value || null;
    dispatch(setDateRange({ startDate, endDate: newEndDate }));
  };

  const handleClearDates = () => {
    dispatch(setDateRange({ startDate: null, endDate: null }));
  };

  const hasDates = startDate || endDate;

  return (
    <DateRangeContainer data-testid="date-range-picker">
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
  );
};

export default DateRangePicker;