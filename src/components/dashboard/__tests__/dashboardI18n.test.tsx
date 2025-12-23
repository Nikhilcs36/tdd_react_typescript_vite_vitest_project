import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../locale/i18n';
import UserDashboardCard from '../UserDashboardCard';
import { UserStats } from '../../../types/loginTracking';
import { describe, beforeEach, it, expect } from 'vitest';

// Mock data for testing
const mockUserStats: UserStats = {
  total_logins: 42,
  last_login: '2025-12-13 14:30:25',
  login_trend: 80,
  weekly_data: {},
  monthly_data: {}
};

describe('Dashboard Components i18n Integration', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it.each([
    {
      lang: "en",
      expectedStats: "User Statistics",
      expectedLogins: "Total Logins", 
      expectedLastLogin: "Last Login",
      expectedTrend: "Login Trend"
    },
    {
      lang: "ml",
      expectedStats: "ഉപയോക്തൃ സ്ഥിതിവിവരക്കണക്കുകൾ",
      expectedLogins: "ആകെ ലോഗിനുകൾ",
      expectedLastLogin: "അവസാന ലോഗിൻ", 
      expectedTrend: "ലോഗിൻ ട്രെൻഡ്"
    },
    {
      lang: "ar",
      expectedStats: "إحصائيات المستخدم",
      expectedLogins: "إجمالي عمليات تسجيل الدخول",
      expectedLastLogin: "آخر تسجيل دخول",
      expectedTrend: "اتجاه تسجيل الدخول"
    }
  ])("displays dashboard translations correctly in $lang", async ({ lang, expectedStats, expectedLogins, expectedLastLogin, expectedTrend }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <UserDashboardCard 
          userStats={mockUserStats}
          loading={false}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedStats)).toBeInTheDocument();
    expect(screen.getByText(expectedLogins)).toBeInTheDocument();
    expect(screen.getByText(expectedLastLogin)).toBeInTheDocument();
    expect(screen.getByText(expectedTrend)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedError: "Error loading dashboard data"
    },
    {
      lang: "ml", 
      expectedError: "ഡാഷ്ബോർഡ് ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്"
    },
    {
      lang: "ar",
      expectedError: "خطأ في تحميل بيانات لوحة التحكم"
    }
  ])("displays error messages correctly in $lang", async ({ lang, expectedError }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <UserDashboardCard 
          userStats={null}
          loading={false}
        />
      </I18nextProvider>
    );

    // UserDashboardCard shows error message when userStats is null
    expect(screen.getByText(expectedError)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedLoading: "Loading..."
    },
    {
      lang: "ml",
      expectedLoading: "ലോഡ് ചെയ്യുന്നു..."
    },
    {
      lang: "ar", 
      expectedLoading: "جاري التحميل..."
    }
  ])("displays loading states correctly in $lang", async ({ lang, expectedLoading }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <UserDashboardCard 
          userStats={null}
          loading={true}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedLoading)).toBeInTheDocument();
  });
});
