import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ApiService, VerifyEmailRequestBody, EmailVerificationRequestBody } from '../services/apiService';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { Spinner as CommonSpinner } from '../components/common/Loading';
import { CaughtError } from '../types/apiError';

interface VerifyEmailErrorResponse {
  expired?: boolean;
  already_verified?: boolean;
  error?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface VerifyEmailPageProps {
  apiService: ApiService<VerifyEmailRequestBody>;
  resendApiService: ApiService<EmailVerificationRequestBody>;
}

const SmallSpinner = tw(CommonSpinner)`w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin`;
const SmallWhiteSpinner = tw(CommonSpinner)`w-4 h-4 border-b-2 border-white rounded-full animate-spin`;

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ apiService, resendApiService }) => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'alreadyVerified'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorMessageKey, setErrorMessageKey] = useState<string | null>(null); // Store translation key
  const [showResendForm, setShowResendForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string>('');
  const [resendMessageKey, setResendMessageKey] = useState<string | null>(null); // Store translation key
  const [mainHeadingKey, setMainHeadingKey] = useState<string>('emailVerification.title'); // Store main heading translation key
  const [translations, setTranslations] = useState({
    verifying: '',
    successMessage: '',
    loginButton: '',
    emailPlaceholder: '',
    sending: '',
    resendButton: '',
    backToLogin: '',
  });
  const hasCalledApi = useRef(false);

  const verifyEmail = useCallback(async (email: string, token: string) => {
    try {
      const response = await apiService.post<{ message?: string; already_verified?: boolean }>('/api/user/verify-email/', { email, token });
      // Check if backend returns already_verified flag (returns 200 OK with already_verified: true)
      if (response?.already_verified) {
        setVerificationStatus('alreadyVerified');
      } else {
        setVerificationStatus('success');
      }
    } catch (error: unknown) {
      setVerificationStatus('error');
      const caughtError = error as CaughtError;
      const response = caughtError.response;
      const data = response?.data as VerifyEmailErrorResponse | undefined;
      const status = response?.status;
      
      if (status === 400) {
        // Handle 400 Bad Request errors
        let errorText = '';
        
        // Check for expired token flag
        if (data?.expired) {
          // Expired token - store translation key
          setErrorMessageKey('emailVerification.errors.expired');
          setShowResendForm(true);
          return;
        }
        
        // Check for already verified flag (defensive programming for edge cases)
        if (data?.already_verified) {
          // Already verified - store translation key
          setErrorMessageKey('emailVerification.alreadyVerified');
          return;
        }
        
        // Check for error message in 'error' field
        if (data?.error) {
          errorText = data.error.toLowerCase();
        }
        // Check for validation errors (e.g., {"email": ["This field is required."]})
        else if (data && typeof data === 'object') {
          // Extract first validation error
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
            errorText = (data[firstKey][0] as string).toLowerCase();
          } else if (firstKey && typeof data[firstKey] === 'string') {
            errorText = (data[firstKey] as string).toLowerCase();
          }
        }
        
        // Match error message patterns
        if (errorText.includes('expired')) {
          // Expired token detected by message content
          setErrorMessageKey('emailVerification.errors.expired');
          setShowResendForm(true);
        } else if (errorText.includes('already verified')) {
          // Already verified detected by message content (defensive)
          setErrorMessageKey('emailVerification.alreadyVerified');
        } else if (errorText.includes('invalid verification token') || errorText.includes('invalid token')) {
          // Invalid token
          setErrorMessageKey('emailVerification.errors.invalid');
        } else if (data?.error) {
          // Show backend error message directly (no translation key)
          setErrorMessageKey(null);
          setErrorMessage(data.error);
        } else if (errorText) {
          // Show validation error (no translation key)
          setErrorMessageKey(null);
          setErrorMessage(errorText);
        } else {
          // Fallback (no translation key)
          setErrorMessageKey(null);
          setErrorMessage('Email verification failed.');
        }
      } else {
        // Non-400 errors
        if (data?.error) {
          setErrorMessageKey(null);
          setErrorMessage(data.error);
        } else {
          setErrorMessageKey(null);
          setErrorMessage('Email verification failed.');
        }
      }
    }
  }, [apiService, setVerificationStatus, setErrorMessageKey, setShowResendForm, setErrorMessage]);

  // Update all translations when language changes
  useEffect(() => {
    // Update UI translations
    setTranslations({
      verifying: t('emailVerification.verifying'),
      successMessage: t('emailVerification.success.message'),
      loginButton: t('emailVerification.success.loginButton'),
      emailPlaceholder: t('emailVerification.resend.emailPlaceholder'),
      sending: t('emailVerification.resend.sending'),
      resendButton: t('emailVerification.resend.button'),
      backToLogin: t('emailVerification.backToLogin'),
    });

    // Update error messages if they have translation keys
    if (errorMessageKey) {
      setErrorMessage(t(errorMessageKey));
    }
    
    // Update resend messages if they have translation keys
    if (resendMessageKey) {
      setResendMessage(t(resendMessageKey));
    }
  }, [t, errorMessageKey, resendMessageKey]);

  // Update main heading key when verification status changes
  useEffect(() => {
    switch (verificationStatus) {
      case 'success':
        setMainHeadingKey('emailVerification.success.title');
        break;
      case 'alreadyVerified':
        setMainHeadingKey('emailVerification.alreadyVerified');
        break;
      case 'error':
        setMainHeadingKey('emailVerification.errors.title');
        break;
      case 'loading':
      default:
        setMainHeadingKey('emailVerification.title');
        break;
    }
  }, [verificationStatus]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (!emailParam || !tokenParam) {
      setVerificationStatus('error');
      setErrorMessageKey('emailVerification.invalidLink');
      return;
    }

    if (hasCalledApi.current) {
      return;
    }

    hasCalledApi.current = true;
    setEmail(emailParam);
    verifyEmail(emailParam, tokenParam);
  }, [searchParams, dispatch, t, verifyEmail]);

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus('loading');
    setResendMessage('');
    setResendMessageKey(null);

    try {
      const response = await resendApiService.post<{ message?: string }>('/api/user/resend-verification/', { email });
      
      // Check if backend returns "already verified" message in success response
      if (response?.message?.toLowerCase().includes('already verified')) {
        setResendStatus('success');
        setResendMessageKey('emailVerification.alreadyVerified');
      } else {
        setResendStatus('success');
        setResendMessageKey('emailVerification.resend.success');
      }
    } catch (error: unknown) {
      setResendStatus('error');
      const caughtError = error as CaughtError;
      const response = caughtError.response;
      const data = response?.data as VerifyEmailErrorResponse | undefined;
      
      // Check for "already verified" error from backend (defensive)
      if (data?.error?.toLowerCase().includes('already verified')) {
        setResendMessageKey('emailVerification.alreadyVerified');
      } else {
        setResendMessageKey('emailVerification.resend.error');
      }
    }
  };

  // Get the translated main heading
  const getMainHeading = () => {
    return t(mainHeadingKey);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {getMainHeading()}
          </h2>
          <div className="mt-2">
            {verificationStatus === 'loading' && (
              <div className="flex items-center justify-center space-x-2">
                <SmallSpinner aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">{translations.verifying}</span>
              </div>
            )}
            
            {verificationStatus === 'success' && (
              <div className="text-green-600 dark:text-green-400">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* Removed the h3 sub-heading since it's now the main heading */}
                <p className="text-green-600 dark:text-green-400">
                  {translations.successMessage}
                </p>
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {translations.loginButton}
                  </Link>
                </div>
              </div>
            )}

            {verificationStatus === 'alreadyVerified' && (
              <div className="text-blue-600 dark:text-blue-400">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full dark:bg-blue-900">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {/* Removed the h3 sub-heading since it's now the main heading */}
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {translations.loginButton}
                  </Link>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="text-red-600 dark:text-red-400">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                {/* Removed the h3 sub-heading since it's now the main heading */}
                <p className="mb-4 text-red-600 dark:text-red-400">{errorMessage}</p>
                
                {showResendForm && (
                  <form onSubmit={handleResendEmail} className="mt-4">
                    <div className="mb-4">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-3 py-2 text-center text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder={translations.emailPlaceholder}
                        required
                        aria-label={translations.emailPlaceholder}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resendStatus === 'loading' || resendStatus === 'success'}
                      className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendStatus === 'loading' ? (
                        <span className="flex items-center space-x-2">
                           <SmallWhiteSpinner aria-hidden="true" />
                          <span>{translations.sending}</span>
                        </span>
                      ) : (
                        translations.resendButton
                      )}
                    </button>
                    {resendStatus === 'success' && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">{resendMessage}</p>
                    )}
                    {resendStatus === 'error' && (
                      <p className={`mt-2 text-sm ${resendMessageKey === 'emailVerification.alreadyVerified' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{resendMessage}</p>
                    )}
                  </form>
                )}
                
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    {translations.backToLogin}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;