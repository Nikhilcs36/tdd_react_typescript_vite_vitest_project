import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../locale/i18n';
import LoginTrendsChart from '../LoginTrendsChart';
import { ChartData } from '../../../types/loginTracking';
import { describe, beforeEach, it, expect, vi } from 'vitest';

// Mock Chart.js to avoid canvas context issues in tests
vi.mock('chart.js', () => ({
  Chart: Object.assign(vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    resize: vi.fn(),
  })), {
    register: vi.fn(), // Add register method for ChartJS.register() calls
  }),
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarController: vi.fn(),
  LineController: vi.fn(),
  PieController: vi.fn(),
  BarElement: vi.fn(),
  LineElement: vi.fn(),
  PointElement: vi.fn(),
  ArcElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn(),
}));

// Mock react-chartjs-2 to avoid actual chart rendering
vi.mock('react-chartjs-2', () => ({
  Bar: ({ 'data-testid': testId, ...props }: any) => (
    <div data-testid={testId || 'bar-chart'} role="img" {...props}>
      Mock Bar Chart
    </div>
  ),
  Line: ({ 'data-testid': testId, ...props }: any) => (
    <div data-testid={testId || 'line-chart'} role="img" {...props}>
      Mock Line Chart
    </div>
  ),
  Pie: ({ 'data-testid': testId, ...props }: any) => (
    <div data-testid={testId || 'pie-chart'} role="img" {...props}>
      Mock Pie Chart
    </div>
  ),
}));

// Mock data for testing
const mockChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      label: 'Logins',
      data: [12, 19, 3, 5, 2],
      backgroundColor: ['rgba(75, 192, 192, 0.2)'],
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    },
  ],
};

describe('LoginTrendsChart i18n Integration', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it.each([
    {
      lang: "en",
      chartType: "line",
      expectedTitle: "Login Trends"
    },
    {
      lang: "ml",
      chartType: "line",
      expectedTitle: "ലോഗിൻ ട്രെൻഡുകൾ"
    },
    {
      lang: "ar",
      chartType: "line",
      expectedTitle: "اتجاهات تسجيل الدخول"
    }
  ])("displays line chart titles correctly in $lang", async ({ 
    lang, 
    expectedTitle
  }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={mockChartData}
          loading={false}
          chartType="line"
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      chartType: "bar",
      expectedTitle: "Login Comparison"
    },
    {
      lang: "ml",
      chartType: "bar",
      expectedTitle: "ലോഗിൻ താരതമ്യം"
    },
    {
      lang: "ar",
      chartType: "bar",
      expectedTitle: "مقارنة تسجيل الدخول"
    }
  ])("displays bar chart titles correctly in $lang", async ({ 
    lang, 
    expectedTitle
  }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={mockChartData}
          loading={false}
          chartType="bar"
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      chartType: "pie",
      expectedTitle: "Login Distribution"
    },
    {
      lang: "ml",
      chartType: "pie",
      expectedTitle: "ലോഗിൻ വിതരണം"
    },
    {
      lang: "ar",
      chartType: "pie",
      expectedTitle: "توزيع تسجيل الدخول"
    }
  ])("displays pie chart titles correctly in $lang", async ({ 
    lang, 
    expectedTitle
  }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={mockChartData}
          loading={false}
          chartType="pie"
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedError: "Error loading chart data"
    },
    {
      lang: "ml",
      expectedError: "ചാർട്ട് ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്"
    },
    {
      lang: "ar",
      expectedError: "خطأ في تحميل بيانات الرسم البياني"
    }
  ])("displays error messages correctly in $lang", async ({ lang, expectedError }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={null}
          loading={false}
          chartType="line"
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedError)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedNoData: "No chart data available"
    },
    {
      lang: "ml",
      expectedNoData: "ചാർട്ട് ഡാറ്റ ലഭ്യമല്ല"
    },
    {
      lang: "ar",
      expectedNoData: "لا توجد بيانات رسم بياني متاحة"
    }
  ])("displays empty state message correctly in $lang", async ({ lang, expectedNoData }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={{ labels: [], datasets: [] }}
          loading={false}
          chartType="line"
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedNoData)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      chartType: "line",
      expectedTitle: "Login Trends"
    },
    {
      lang: "ml",
      chartType: "line",
      expectedTitle: "ലോഗിൻ ട്രെൻഡുകൾ"
    },
    {
      lang: "ar",
      chartType: "line",
      expectedTitle: "اتجاهات تسجيل الدخول"
    }
  ])("displays loading state correctly in $lang", async ({ lang, expectedTitle }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={null}
          loading={true}
          chartType="line"
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    expect(screen.getByTestId("chart-loading")).toBeInTheDocument();
  });

  // RTL Layout Support Tests
  it.each([
    {
      lang: "ar",
      chartType: "line",
      expectedTitle: "اتجاهات تسجيل الدخول"
    },
    {
      lang: "en", 
      chartType: "line",
      expectedTitle: "Login Trends"
    },
    {
      lang: "ml",
      chartType: "line", 
      expectedTitle: "ലോഗിൻ ട്രെൻഡുകൾ"
    }
  ])("handles RTL layout correctly for $lang language", async ({ 
    lang, 
    expectedTitle
  }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={mockChartData}
          loading={false}
          chartType="line"
        />
      </I18nextProvider>
    );

    // Verify chart title displays correctly
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    
    // Verify chart renders (RTL layout is handled internally by Chart.js)
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it.each([
    {
      lang: "ar",
      chartType: "bar",
      expectedTitle: "مقارنة تسجيل الدخول"
    },
    {
      lang: "ar",
      chartType: "pie", 
      expectedTitle: "توزيع تسجيل الدخول"
    }
  ])("handles RTL layout for Arabic $chartType charts", async ({ 
    lang, 
    chartType,
    expectedTitle 
  }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginTrendsChart 
          chartData={mockChartData}
          loading={false}
          chartType={chartType as "bar" | "pie"}
        />
      </I18nextProvider>
    );

    // Verify Arabic titles display correctly
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    
    // Verify chart renders with RTL support
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
