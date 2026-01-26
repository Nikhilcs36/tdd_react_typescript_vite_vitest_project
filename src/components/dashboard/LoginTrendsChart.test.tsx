import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginTrendsChart from './LoginTrendsChart';
import { ChartData } from '../../types/loginTracking';

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  }),
}));

// Mock Chart.js components with options capture
let capturedLineOptions: any;
let capturedBarOptions: any;
let capturedPieOptions: any;

vi.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    capturedLineOptions = props.options;
    return <div data-testid="line-chart" />;
  },
  Bar: (props: any) => {
    capturedBarOptions = props.options;
    return <div data-testid="bar-chart" />;
  },
  Pie: (props: any) => {
    capturedPieOptions = props.options;
    return <div data-testid="pie-chart" />;
  },
}));

describe('LoginTrendsChart', () => {
  const mockChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Login Trends',
      data: [100, 150, 200, 180],
      backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'],
      borderColor: '#36a2eb',
      borderWidth: 2
    }]
  };

  it('should render line chart with data', () => {
    render(<LoginTrendsChart chartData={mockChartData} loading={false} chartType="line" />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText('dashboard.login_trends')).toBeInTheDocument();
  });

  it('should render bar chart with data', () => {
    render(<LoginTrendsChart chartData={mockChartData} loading={false} chartType="bar" />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('dashboard.login_comparison')).toBeInTheDocument();
  });

  it('should render pie chart with data', () => {
    render(<LoginTrendsChart chartData={mockChartData} loading={false} chartType="pie" />);
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByText('dashboard.login_distribution')).toBeInTheDocument();
  });

  it('should display loading state when loading is true', () => {
    render(<LoginTrendsChart chartData={null} loading={true} chartType="line" />);
    
    expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should display error state when chartData is null and not loading', () => {
    render(<LoginTrendsChart chartData={null} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.error_loading_chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should display empty state when chartData has no data', () => {
    const emptyChartData: ChartData = {
      labels: [],
      datasets: []
    };
    
    render(<LoginTrendsChart chartData={emptyChartData} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle different chart types with appropriate titles', () => {
    const { rerender } = render(
      <LoginTrendsChart chartData={mockChartData} loading={false} chartType="line" />
    );
    expect(screen.getByText('dashboard.login_trends')).toBeInTheDocument();

    rerender(
      <LoginTrendsChart chartData={mockChartData} loading={false} chartType="bar" />
    );
    expect(screen.getByText('dashboard.login_comparison')).toBeInTheDocument();

    rerender(
      <LoginTrendsChart chartData={mockChartData} loading={false} chartType="pie" />
    );
    expect(screen.getByText('dashboard.login_distribution')).toBeInTheDocument();
  });

  // Test edge cases that could cause "Cannot read properties of undefined" error
  it('should handle undefined chartData gracefully', () => {
    render(<LoginTrendsChart chartData={undefined as any} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.error_loading_chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle chartData with undefined labels', () => {
    const invalidChartData = {
      labels: undefined,
      datasets: [{ data: [1, 2, 3] }]
    } as any;
    
    render(<LoginTrendsChart chartData={invalidChartData} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle chartData with undefined datasets', () => {
    const invalidChartData = {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: undefined
    } as any;
    
    render(<LoginTrendsChart chartData={invalidChartData} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle chartData with empty datasets array', () => {
    const emptyDatasetsChartData: ChartData = {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: []
    };
    
    render(<LoginTrendsChart chartData={emptyDatasetsChartData} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle chartData with empty labels array', () => {
    const emptyLabelsChartData: ChartData = {
      labels: [],
      datasets: [{ data: [1, 2, 3], label: 'Test' }]
    };
    
    render(<LoginTrendsChart chartData={emptyLabelsChartData} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle chartData with null datasets', () => {
    const invalidChartData = {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: null
    } as any;
    
    render(<LoginTrendsChart chartData={invalidChartData} loading={false} chartType="line" />);
    
    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should handle chartData with null labels', () => {
    const invalidChartData = {
      labels: null,
      datasets: [{ data: [1, 2, 3], label: 'Test' }]
    } as any;

    render(<LoginTrendsChart chartData={invalidChartData} loading={false} chartType="line" />);

    expect(screen.getByText('dashboard.no_chart_data')).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should display custom title when provided', () => {
    const customTitle = "Custom Chart Title - User Data";
    render(<LoginTrendsChart chartData={mockChartData} loading={false} chartType="line" customTitle={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.queryByText('dashboard.login_trends')).not.toBeInTheDocument();
  });

  it('should use custom title in loading state', () => {
    const customTitle = "Loading Custom Title";
    render(<LoginTrendsChart chartData={null} loading={true} chartType="line" customTitle={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.queryByText('dashboard.login_trends')).not.toBeInTheDocument();
  });

  it('should use custom title in error state', () => {
    const customTitle = "Error Custom Title";
    render(<LoginTrendsChart chartData={null} loading={false} chartType="line" customTitle={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.queryByText('dashboard.login_trends')).not.toBeInTheDocument();
  });

  it('should use custom title in empty state', () => {
    const emptyChartData: ChartData = {
      labels: [],
      datasets: []
    };
    const customTitle = "Empty Custom Title";

    render(<LoginTrendsChart chartData={emptyChartData} loading={false} chartType="line" customTitle={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.queryByText('dashboard.login_trends')).not.toBeInTheDocument();
  });

  it('should hide chart title when customTitle is provided', () => {
    const customTitle = "Custom Chart Title";
    render(<LoginTrendsChart chartData={mockChartData} loading={false} chartType="line" customTitle={customTitle} />);

    expect(capturedLineOptions.plugins.title.display).toBe(false);
  });

  it('should show chart title when no customTitle is provided', () => {
    render(<LoginTrendsChart chartData={mockChartData} loading={false} chartType="line" />);

    expect(capturedLineOptions.plugins.title.display).toBe(true);
  });
});
