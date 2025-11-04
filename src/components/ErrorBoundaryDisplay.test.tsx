import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../locale/i18n';
import ErrorBoundaryDisplay from './ErrorBoundaryDisplay';

// Helper function to render the component with i18n support
const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('ErrorBoundaryDisplay', () => {
  it('renders error message for a JavaScript error', () => {
    const error = new Error('Something went wrong');
    renderWithI18n(<ErrorBoundaryDisplay error={error} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    const error = new Error('Custom error');
    renderWithI18n(<ErrorBoundaryDisplay error={error} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });
});
