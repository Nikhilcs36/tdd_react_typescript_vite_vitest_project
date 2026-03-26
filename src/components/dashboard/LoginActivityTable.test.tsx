import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoginActivityTable from './LoginActivityTable';
import { LoginActivityItem } from '../../types/loginTracking';

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Handle specific translation keys for testing
      switch (key) {
        case 'dashboard.load_more':
          return 'Load More';
        case 'dashboard.loading':
          return 'Loading...';
        case 'dashboard.all_records_loaded':
          return 'All records loaded';
        case 'dashboard.showing_records':
          return options ? `Showing ${options.current} of ${options.total} records` : key;
        default:
          return key;
      }
    },
    i18n: { language: 'en' }
  }),
}));

describe('LoginActivityTable', () => {
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

  it('should render login activity table with data', () => {
    render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} />);
    
    expect(screen.getByText('testuser1')).toBeInTheDocument();
    expect(screen.getByText('testuser2')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.101')).toBeInTheDocument();
  });

  it('should display loading state when loading is true', () => {
    render(<LoginActivityTable loginActivity={[]} loading={true} />);
    
    expect(screen.getByTestId('activity-table-loading')).toBeInTheDocument();
    expect(screen.queryByText('testuser1')).not.toBeInTheDocument();
  });

  it('should display empty state when no data and not loading', () => {
    render(<LoginActivityTable loginActivity={[]} loading={false} />);
    
    expect(screen.getByText('dashboard.no_activity_data')).toBeInTheDocument();
  });

  it('should display success status indicator for successful logins', () => {
    render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} />);
    
    // Should show success indicator for first item (success: true)
    expect(screen.getByText('dashboard.success')).toBeInTheDocument();
  });

  it('should display failure status indicator for failed logins', () => {
    render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} />);
    
    // Should show failure indicator for second item (success: false)
    expect(screen.getByText('dashboard.failed')).toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} />);
    
    // Check that dates are formatted (should contain "Dec" for December)
    const decElements = screen.getAllByText(/Dec/);
    expect(decElements.length).toBeGreaterThan(0);
    expect(decElements[0]).toBeInTheDocument();
  });

  it('should truncate long user agent strings', () => {
    render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} />);

    // User agent should be displayed but might be truncated
    const mozillaElements = screen.getAllByText(/Mozilla/);
    expect(mozillaElements.length).toBeGreaterThan(0);
    expect(mozillaElements[0]).toBeInTheDocument();
  });

  it('should show scroll bar when content exceeds max height', () => {
    // Create enough mock data to exceed max-h-96 (384px)
    // Each row is roughly 50px, so 15 rows = ~750px > 384px
    const manyActivities: LoginActivityItem[] = Array.from({ length: 15 }, (_, index) => ({
      id: index + 1,
      username: `testuser${index + 1}`,
      timestamp: `2025-12-${String(index + 1).padStart(2, '0')} 14:30:25`,
      ip_address: `192.168.1.${100 + index}`,
      user_agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) UserAgent${index}`,
      success: index % 2 === 0 // Alternate success/failure
    }));

    render(<LoginActivityTable loginActivity={manyActivities} loading={false} />);

    // Check that the scroll container has overflow-y-auto class
    const scrollContainer = screen.getByText('dashboard.login_activity').closest('div')?.parentElement?.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('max-h-96');
  });

  it('should handle and display 100 records correctly', () => {
    // Create 100 mock records to test the component's ability to handle large datasets
    const hundredActivities: LoginActivityItem[] = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      username: `testuser${index + 1}`,
      timestamp: `2026-01-${String(Math.floor(index / 3) + 1).padStart(2, '0')} ${String(9 + (index % 10)).padStart(2, '0')}:${String(30 + (index % 30)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
      ip_address: `192.168.1.${(index % 255) + 1}`,
      user_agent: index % 3 === 0 
        ? "PostmanRuntime/7.51.0" 
        : index % 3 === 1 
          ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          : "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      success: index % 10 !== 0 // 90% success rate
    }));

    render(<LoginActivityTable loginActivity={hundredActivities} loading={false} />);
    
    // Verify that all 100 usernames are rendered
    for (let i = 1; i <= 10; i++) { // Check first 10 to verify rendering works
      expect(screen.getByText(`testuser${i}`)).toBeInTheDocument();
    }
    
    // Verify scroll container is present for large dataset
    const scrollContainer = screen.getByText('dashboard.login_activity').closest('div')?.parentElement?.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('max-h-96');
  });

  describe('Load More functionality', () => {
    it('should show "Load More" button when hasNext is true', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} hasNext={true} onLoadMore={() => {}} />);

      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });

    it('should not show "Load More" button when hasNext is false', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} hasNext={false} onLoadMore={() => {}} />);

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });

    it('should not show "Load More" button when hasNext is undefined', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} onLoadMore={() => {}} />);

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });

    it('should call onLoadMore when "Load More" button is clicked', async () => {
      const mockOnLoadMore = vi.fn();
      const user = userEvent.setup();

      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} hasNext={true} onLoadMore={mockOnLoadMore} />);

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      await user.click(loadMoreButton);

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should show loading state on "Load More" button when loadMoreLoading is true', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} hasNext={true} onLoadMore={() => {}} loadMoreLoading={true} />);

      const loadMoreButton = screen.getByRole('button', { name: /loading/i });
      expect(loadMoreButton).toBeDisabled();
      expect(loadMoreButton).toHaveTextContent(/loading/i);
    });

    it('should not show record count when totalCount is provided', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} totalCount={150} />);

      expect(screen.queryByText(/showing.*records/i)).not.toBeInTheDocument();
    });

    it('should show "No more records" message when hasNext is false and data exists', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} hasNext={false} />);

      expect(screen.getByText('All records loaded')).toBeInTheDocument();
    });

    it('should not show "No more records" message when hasNext is true', () => {
      render(<LoginActivityTable loginActivity={mockLoginActivity} loading={false} hasNext={true} onLoadMore={() => {}} />);

      expect(screen.queryByText('All records loaded')).not.toBeInTheDocument();
    });
  });
});
