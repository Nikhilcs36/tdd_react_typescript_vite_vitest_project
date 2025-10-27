import React from 'react';
import tw from 'twin.macro';
import { useTranslation } from 'react-i18next';
import { getUserFriendlyErrorMessage } from '../services/errorService';

// Styled components for error display
const ErrorContainer = tw.div`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4`;
const ErrorTitle = tw.h3`text-red-800 dark:text-red-200 font-semibold mb-2`;
const ErrorMessage = tw.p`text-red-700 dark:text-red-300 text-sm`;
const RetryButton = tw.button`bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded mt-3 transition-colors`;

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

/**
 * Reusable error display component that shows user-friendly error messages
 * with i18n support and optional retry functionality
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title,
  className = ''
}) => {
  const { t } = useTranslation();

  // Get user-friendly error message
  // For JavaScript Error objects, use the error message directly
  // For API errors, use the centralized error handler
  const errorMessage = error instanceof Error 
    ? error.message 
    : getUserFriendlyErrorMessage(error);
  
  // Default title based on error type
  const defaultTitle = error.response?.status === 401 
    ? t('errors.title.authentication', { defaultValue: 'Authentication Error' })
    : t('errors.title.general', { defaultValue: 'Error' });

  return (
    <ErrorContainer className={className}>
      <ErrorTitle>
        {title || defaultTitle}
      </ErrorTitle>
      <ErrorMessage>
        {errorMessage}
      </ErrorMessage>
      {onRetry && (
        <RetryButton onClick={onRetry}>
          {t('errors.retry', { defaultValue: 'Try Again' })}
        </RetryButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorDisplay;
