import React from 'react';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ChartData } from '../../types/loginTracking';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Styled components
const ChartContainer = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4 min-h-[400px]`;
const ChartHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
const ChartTitle = tw.h3`text-lg font-semibold dark:text-dark-text`;
const LoadingSpinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400`;
const EmptyState = tw.div`text-center text-gray-500 dark:text-gray-400 py-8`;

interface LoginTrendsChartProps {
  chartData: ChartData | null;
  loading: boolean;
  chartType: 'line' | 'bar' | 'pie';
  customTitle?: string;
}

/**
 * LoginTrendsChart Component
 * Displays login trends data in various chart formats
 * Shows loading state, error state, and success state
 */
const LoginTrendsChart: React.FC<LoginTrendsChartProps> = React.memo(({ chartData, loading, chartType, customTitle }) => {
  const { t, i18n } = useTranslation();

  // Get the chart title - use customTitle if provided, otherwise use default
  const getChartTitle = () => {
    if (customTitle) return customTitle;

    return chartType === 'line'
      ? t('dashboard.login_trends')
      : chartType === 'bar'
      ? t('dashboard.login_comparison')
      : t('dashboard.login_distribution');
  };

  // Chart options configuration with RTL support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: i18n.language === 'ar', // Enable RTL for Arabic
      },
      title: {
        display: !customTitle, // Hide chart title if customTitle is provided (header shows it)
        text: getChartTitle(),
      },
    },
    // RTL layout configuration
    layout: {
      padding: i18n.language === 'ar' ? { right: 20 } : { left: 20 }
    }
  };

  // Render loading state
  if (loading) {
    return (
      <ChartContainer data-testid="chart-loading">
        <ChartHeader>
          <ChartTitle>
            {getChartTitle()}
          </ChartTitle>
        </ChartHeader>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </ChartContainer>
    );
  }

  // Render error state
  if (!chartData) {
    return (
      <ChartContainer>
        <ChartHeader>
          <ChartTitle>
            {getChartTitle()}
          </ChartTitle>
        </ChartHeader>
        <ErrorMessage>
          {t('dashboard.error_loading_chart')}
        </ErrorMessage>
      </ChartContainer>
    );
  }

  // Render empty state - add comprehensive null checking
  if (!chartData ||
      !chartData.labels ||
      !chartData.datasets ||
      chartData.labels.length === 0 ||
      chartData.datasets.length === 0) {
    return (
      <ChartContainer>
        <ChartHeader>
          <ChartTitle>
            {getChartTitle()}
          </ChartTitle>
        </ChartHeader>
        <EmptyState>
          {t('dashboard.no_chart_data')}
        </EmptyState>
      </ChartContainer>
    );
  }

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      default:
        return <Line data={chartData} options={chartOptions} />;
    }
  };

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>
          {getChartTitle()}
        </ChartTitle>
      </ChartHeader>
      <div className="h-64 mt-4">
        {renderChart()}
      </div>
    </ChartContainer>
  );
});

LoginTrendsChart.displayName = 'LoginTrendsChart';

export default LoginTrendsChart;
