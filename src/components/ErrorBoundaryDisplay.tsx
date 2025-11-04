import React from 'react';
import tw from 'twin.macro';
import { useTranslation } from 'react-i18next';

// Styled components for error display
const ErrorContainer = tw.div`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4`;
const ErrorTitle = tw.h3`text-red-800 dark:text-red-200 font-semibold mb-2`;
const ErrorMessage = tw.p`text-red-700 dark:text-red-300 text-sm`;

interface ErrorBoundaryDisplayProps {
  error: Error;
  title?: string;
  className?: string;
}

/**
 * Simple display component for JavaScript runtime errors caught by ErrorBoundary
 * This component should NOT be used for API errors - those are handled by GlobalErrorDisplay
 */
const ErrorBoundaryDisplay: React.FC<ErrorBoundaryDisplayProps> = ({
  error,
  title,
  className = ''
}) => {
  const { t } = useTranslation();

  // Default title for runtime errors
  const defaultTitle = t('errors.title.general', { defaultValue: 'Application Error' });

  return (
    <ErrorContainer className={className}>
      <ErrorTitle>
        {title || defaultTitle}
      </ErrorTitle>
      <ErrorMessage>
        {error.message}
      </ErrorMessage>
    </ErrorContainer>
  );
};

export default ErrorBoundaryDisplay;
