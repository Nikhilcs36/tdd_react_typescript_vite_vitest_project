import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import tw from 'twin.macro';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store';
import { clearGlobalError } from '../store/globalErrorSlice';
import { logoutSuccess } from '../store/actions';

// Styled components for the global error display (v2)
const Overlay = tw.div`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50`;
const ErrorContainer = tw.div`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4`;
const ErrorTitle = tw.h2`text-2xl font-bold text-red-600 dark:text-red-400 mb-4`;
const ErrorMessage = tw.p`text-gray-700 dark:text-gray-300 mb-6`;
const ButtonContainer = tw.div`flex gap-2`;
const RetryButton = tw.button`flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors`;
const LoginButton = tw.button`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors`;

const GlobalErrorDisplay: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state: RootState) => state.globalError);

  if (!error) {
    return null;
  }

  // Check if this is an authorization error (401/403)
  const isAuthError = (error as any).response?.status === 401 || (error as any).response?.status === 403 ||
                     error.translationKey === 'errors.401.token_invalid_or_expired' ||
                     error.translationKey === 'userlist.accessDeniedMessage';

  // Translate the error message if a translation key is available
  const errorMessage =
    error.translationKey && t(error.translationKey, { defaultValue: error.message });

  const handleRetry = () => {
    dispatch(clearGlobalError());
  };

  const handleGoToLogin = () => {
    dispatch(logoutSuccess());
    dispatch(clearGlobalError());
    navigate('/login');
  };

  return (
    <Overlay>
      <ErrorContainer>
        <ErrorTitle>
          {isAuthError
            ? t('errors.title.authorization', { defaultValue: 'Authorization Error' })
            : t('errors.title.general', { defaultValue: 'Error' })
          }
        </ErrorTitle>
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <ButtonContainer>
          {!isAuthError && (
            <RetryButton onClick={handleRetry}>
              {t('errors.retry', { defaultValue: 'Try Again' })}
            </RetryButton>
          )}
          <LoginButton onClick={handleGoToLogin}>
            {t('errors.goToLogin', { defaultValue: 'Go to Login' })}
          </LoginButton>
        </ButtonContainer>
      </ErrorContainer>
    </Overlay>
  );
};

export default GlobalErrorDisplay;
