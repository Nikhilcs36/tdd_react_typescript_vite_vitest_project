import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../locale/i18n';
import LoginActivityTable from '../LoginActivityTable';
import { LoginActivityItem } from '../../../types/loginTracking';
import { describe, beforeEach, it, expect, vi } from 'vitest';

// Mock data for testing
const mockLoginActivity: LoginActivityItem[] = [
  {
    id: 1,
    username: 'testuser1',
    timestamp: '2025-12-13 14:30:25',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    success: true
  },
  {
    id: 2,
    username: 'testuser2',
    timestamp: '2025-12-12 10:15:30',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    success: false
  }
];

describe('LoginActivityTable i18n Integration', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it.each([
    {
      lang: "en",
      expectedTitle: "Login Activity",
      expectedRowNumber: "#",
      expectedUsername: "Username",
      expectedTimestamp: "Timestamp",
      expectedIpAddress: "IP Address",
      expectedUserAgent: "User Agent",
      expectedStatus: "Status",
      expectedSuccess: "Success",
      expectedFailed: "Failed",
      expectedNoData: "No login activity data available"
    },
    {
      lang: "ml",
      expectedTitle: "ലോഗിൻ പ്രവർത്തനം",
      expectedRowNumber: "#",
      expectedUsername: "ഉപയോക്തൃനാമം",
      expectedTimestamp: "സമയമുദ്ര",
      expectedIpAddress: "ഐപി വിലാസം",
      expectedUserAgent: "ഉപയോക്തൃ ഏജന്റ്",
      expectedStatus: "സ്ഥിതി",
      expectedSuccess: "വിജയം",
      expectedFailed: "പരാജയപ്പെട്ടു",
      expectedNoData: "ലോഗിൻ പ്രവർത്തന ഡാറ്റ ലഭ്യമല്ല"
    },
    {
      lang: "ar",
      expectedTitle: "نشاط تسجيل الدخول",
      expectedRowNumber: "#",
      expectedUsername: "اسم المستخدم",
      expectedTimestamp: "الطابع الزمني",
      expectedIpAddress: "عنوان IP",
      expectedUserAgent: "وكيل المستخدم",
      expectedStatus: "الحالة",
      expectedSuccess: "نجح",
      expectedFailed: "فشل",
      expectedNoData: "لا توجد بيانات نشاط تسجيل دخول متاحة"
    }
  ])("displays table headers correctly in $lang", async ({ 
    lang, 
    expectedTitle, 
    expectedRowNumber,
    expectedUsername, 
    expectedTimestamp, 
    expectedIpAddress, 
    expectedUserAgent, 
    expectedStatus 
  }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={mockLoginActivity}
          loading={false}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    expect(screen.getByText(expectedRowNumber)).toBeInTheDocument();
    expect(screen.getByText(expectedUsername)).toBeInTheDocument();
    expect(screen.getByText(expectedTimestamp)).toBeInTheDocument();
    expect(screen.getByText(expectedIpAddress)).toBeInTheDocument();
    expect(screen.getByText(expectedUserAgent)).toBeInTheDocument();
    expect(screen.getByText(expectedStatus)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedSuccess: "Success",
      expectedFailed: "Failed"
    },
    {
      lang: "ml",
      expectedSuccess: "വിജയം",
      expectedFailed: "പരാജയപ്പെട്ടു"
    },
    {
      lang: "ar",
      expectedSuccess: "نجح",
      expectedFailed: "فشل"
    }
  ])("displays status badges correctly in $lang", async ({ lang, expectedSuccess, expectedFailed }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={mockLoginActivity}
          loading={false}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedSuccess)).toBeInTheDocument();
    expect(screen.getByText(expectedFailed)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedNoData: "No login activity data available"
    },
    {
      lang: "ml",
      expectedNoData: "ലോഗിൻ പ്രവർത്തന ഡാറ്റ ലഭ്യമല്ല"
    },
    {
      lang: "ar",
      expectedNoData: "لا توجد بيانات نشاط تسجيل دخول متاحة"
    }
  ])("displays empty state message correctly in $lang", async ({ lang, expectedNoData }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={[]}
          loading={false}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(expectedNoData)).toBeInTheDocument();
  });

  it.each([
    {
      lang: "en",
      expectedTitle: "Login Activity"
    },
    {
      lang: "ml",
      expectedTitle: "ലോഗിൻ പ്രവർത്തനം"
    },
    {
      lang: "ar", 
      expectedTitle: "نشاط تسجيل الدخول"
    }
  ])("displays loading state correctly in $lang", async ({ lang, expectedTitle }) => {
    await i18n.changeLanguage(lang);
    
    render(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={[]}
          loading={true}
        />
      </I18nextProvider>
    );

    // LoginActivityTable shows the table title when loading
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    // And should have the loading spinner
    expect(screen.getByTestId("activity-table-loading")).toBeInTheDocument();
  });

  // Test for load more button text in different languages
  it.each([
    {
      lang: "en",
      expectedLoadMore: "Load More",
      expectedAllRecordsLoaded: "All records loaded"
    },
    {
      lang: "ml",
      expectedLoadMore: "കൂടുതൽ ലോഡ് ചെയ്യുക",
      expectedAllRecordsLoaded: "എല്ലാ റെക്കോർഡുകളും ലോഡ് ചെയ്തു"
    },
    {
      lang: "ar",
      expectedLoadMore: "تحميل المزيد",
      expectedAllRecordsLoaded: "تم تحميل جميع السجلات"
    }
  ])("displays load more functionality correctly in $lang", async ({ lang, expectedLoadMore, expectedAllRecordsLoaded }) => {
    await i18n.changeLanguage(lang);
    
    // Test 1: Load More button when hasNext is true
    const mockLoadMore = vi.fn();
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={mockLoginActivity}
          loading={false}
          hasNext={true}
          onLoadMore={mockLoadMore}
        />
      </I18nextProvider>
    );

    // Should show Load More button
    const loadMoreButton = screen.getByTestId("load-more-button");
    expect(loadMoreButton).toBeInTheDocument();
    expect(loadMoreButton).toHaveTextContent(expectedLoadMore);

    // Test 2: All records loaded message when hasNext is false
    rerender(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={mockLoginActivity}
          loading={false}
          hasNext={false}
        />
      </I18nextProvider>
    );

    // Should show "All records loaded" message
    const allLoadedMessage = screen.getByTestId("all-loaded-message");
    expect(allLoadedMessage).toBeInTheDocument();
    expect(allLoadedMessage).toHaveTextContent(expectedAllRecordsLoaded);
  });

  // Test for loading state on load more button
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
  ])("displays loading state on load more button correctly in $lang", async ({ lang, expectedLoading }) => {
    await i18n.changeLanguage(lang);
    
    const mockLoadMore = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <LoginActivityTable 
          loginActivity={mockLoginActivity}
          loading={false}
          hasNext={true}
          onLoadMore={mockLoadMore}
          loadMoreLoading={true}
        />
      </I18nextProvider>
    );

    // Should show loading text on the button when loadMoreLoading is true
    const loadMoreButton = screen.getByTestId("load-more-button");
    expect(loadMoreButton).toBeInTheDocument();
    expect(loadMoreButton).toHaveTextContent(expectedLoading);
    expect(loadMoreButton).toBeDisabled();
  });
});
