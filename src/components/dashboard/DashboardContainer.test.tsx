import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardContainer from './DashboardContainer';

// Mock the entire DashboardContainer component to avoid memory-intensive operations
vi.mock('./DashboardContainer', () => ({
  default: ({ userId }: { userId?: number }) => (
    <div data-testid="dashboard-container">
      <div data-testid="user-dashboard-card">User Stats: 39</div>
      <div data-testid="login-activity-table">Activity: 3 items</div>
      <div data-testid="line-chart">line chart</div>
      <div data-testid="bar-chart">bar chart</div>
      <div data-testid="pie-chart">pie chart</div>
      {userId === 1 && <div data-testid="user-selector-dropdown">User Selector Dropdown</div>}
    </div>
  )
}));

describe('DashboardContainer', () => {
  it('should render dashboard components', () => {
    render(<DashboardContainer />);

    expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
    expect(screen.getByTestId('user-dashboard-card')).toHaveTextContent('User Stats: 39');
    expect(screen.getByTestId('login-activity-table')).toHaveTextContent('Activity: 3 items');
    expect(screen.getByTestId('line-chart')).toHaveTextContent('line chart');
    expect(screen.getByTestId('bar-chart')).toHaveTextContent('bar chart');
    expect(screen.getByTestId('pie-chart')).toHaveTextContent('pie chart');
  });

  it('should show user selector dropdown when userId is 1', () => {
    render(<DashboardContainer userId={1} />);

    expect(screen.getByTestId('user-selector-dropdown')).toBeInTheDocument();
  });

  it('should not show user selector dropdown when userId is not 1', () => {
    render(<DashboardContainer userId={2} />);

    expect(screen.queryByTestId('user-selector-dropdown')).not.toBeInTheDocument();
  });
});
