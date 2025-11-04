import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import tw from 'twin.macro';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store';
import { clearGlobalError } from '../store/globalErrorSlice';

// Styled components for the global error display (v2)
const Overlay = tw.div`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50`;
const ErrorContainer = tw.div`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4`;
const ErrorTitle = tw.h2`text-2xl font-bold text-red-600 dark:text-red-400 mb-4`;
const ErrorMessage = tw.p`text-gray-700 dark:text-gray-300 mb-6`;
const RetryButton = tw.button`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors`;

const GlobalErrorDisplay: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { error } = useSelector((state: RootState) => state.globalError);

  if (!error) {
    return null;
  }

  // Translate the error message if a translation key is available
  const errorMessage =
    error.translationKey && t(error.translationKey, { defaultValue: error.message });

  const handleRetry = () => {
    dispatch(clearGlobalError());
  };

  return (
    <Overlay>
      <ErrorContainer>
        <ErrorTitle>{t('errors.title.general', { defaultValue: 'Error' })}</ErrorTitle>
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <RetryButton onClick={handleRetry}>
          {t('errors.retry', { defaultValue: 'Try Again' })}
        </RetryButton>
      </ErrorContainer>
    </Overlay>
  );
};

export default GlobalErrorDisplay;
