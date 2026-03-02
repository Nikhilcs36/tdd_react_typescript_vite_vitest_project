import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import store from '../store';

// Mock the necessary dependencies
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useTranslation: vi.fn(),
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<Provider store={store}>{ui}</Provider>);
};

describe('VerifyEmailPage', () => {
  const mockApiService = {
    post: vi.fn(),
  };
  
  const mockResendApiService = {
    post: vi.fn(),
  };

  const mockT = (key: string) => key;

  beforeEach(() => {
    (useTranslation as any).mockReturnValue({ t: mockT });
  });

  it('renders loading state initially', () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=valid-token')]);

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    expect(screen.getByText('emailVerification.verifying')).toBeInTheDocument();
  });

  it('renders success state when email verification succeeds', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=valid-token')]);
    mockApiService.post.mockResolvedValue({ message: 'Email verified successfully. You can now log in.' });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.success.title')).toBeInTheDocument();
    });
    expect(screen.getByText('emailVerification.success.message')).toBeInTheDocument();
  });

  it('renders error state when email verification fails with invalid token', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=invalid-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Invalid verification token.' },
      },
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
    expect(screen.getByText('emailVerification.errors.title')).toBeInTheDocument();
    });
    expect(screen.getByText('emailVerification.errors.invalid')).toBeInTheDocument();
  });

  it('renders expired token state with resend form', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.errors.title')).toBeInTheDocument();
    });
    expect(screen.getByText('emailVerification.errors.expired')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('emailVerification.resend.emailPlaceholder')).toBeInTheDocument();
  });

  it('renders already verified state when backend returns already_verified in error response', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=valid-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Email already verified.', already_verified: true },
      },
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.errors.title')).toBeInTheDocument();
    });
    expect(screen.getByText('emailVerification.alreadyVerified')).toBeInTheDocument();
  });

  it('renders already verified state when backend returns success with already_verified flag', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=valid-token')]);
    mockApiService.post.mockResolvedValue({
      message: 'Email is already verified.',
      already_verified: true,
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.alreadyVerified')).toBeInTheDocument();
    });
    expect(screen.getByText('emailVerification.success.loginButton')).toBeInTheDocument();
  });

  it('resends verification email when resend button is clicked', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });
    mockResendApiService.post.mockResolvedValue({
      message: 'Verification email sent successfully.',
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('emailVerification.resend.button'));

    await waitFor(() => {
      expect(mockResendApiService.post).toHaveBeenCalledWith(
        '/api/user/resend-verification/',
        { email: 'test@example.com' }
      );
    });

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.success')).toBeInTheDocument();
    });
  });

  it('shows error when resend email fails', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });
    mockResendApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Failed to resend verification email.' },
      },
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('emailVerification.resend.button'));

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.error')).toBeInTheDocument();
    });
  });

  it('disables resend button after successful resend', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });
    mockResendApiService.post.mockResolvedValue({
      message: 'Verification email sent successfully.',
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.button')).toBeInTheDocument();
    });

    const resendButton = screen.getByText('emailVerification.resend.button');
    
    // Button should be enabled initially
    expect(resendButton).not.toBeDisabled();
    
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.success')).toBeInTheDocument();
    });

    // Button should be disabled after successful resend
    expect(resendButton).toBeDisabled();
  });

  it('shows already verified message when resending to already verified email (error response)', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });
    mockResendApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Email already verified.' },
      },
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.button')).toBeInTheDocument();
    });

    const resendButton = screen.getByText('emailVerification.resend.button');
    
    // Button should be enabled initially
    expect(resendButton).not.toBeDisabled();
    
    fireEvent.click(resendButton);

    await waitFor(() => {
      // Should show "Email is already verified." not "Verification email sent successfully."
      expect(screen.getByText('emailVerification.alreadyVerified')).toBeInTheDocument();
    });

    // Should NOT show success message
    expect(screen.queryByText('emailVerification.resend.success')).not.toBeInTheDocument();
    // Should NOT show generic error message
    expect(screen.queryByText('emailVerification.resend.error')).not.toBeInTheDocument();
  });

  it('shows already verified message when backend returns success with already verified message', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });
    mockResendApiService.post.mockResolvedValue({
      message: 'Email is already verified.',
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.resend.button')).toBeInTheDocument();
    });

    const resendButton = screen.getByText('emailVerification.resend.button');
    
    // Button should be enabled initially
    expect(resendButton).not.toBeDisabled();
    
    fireEvent.click(resendButton);

    await waitFor(() => {
      // Should show "Email is already verified." not "Verification email sent successfully."
      expect(screen.getByText('emailVerification.alreadyVerified')).toBeInTheDocument();
    });

    // Should NOT show success message
    expect(screen.queryByText('emailVerification.resend.success')).not.toBeInTheDocument();
    // Button should be disabled after success response
    expect(resendButton).toBeDisabled();
  });

  it('renders invalid link state when parameters are missing', () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('')]);

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    expect(screen.getByText('emailVerification.errors.title')).toBeInTheDocument();
    expect(screen.getByText('emailVerification.invalidLink')).toBeInTheDocument();
  });

  it('displays login button on success state', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=valid-token')]);
    mockApiService.post.mockResolvedValue({});

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.success.loginButton')).toBeInTheDocument();
    });
  });

  it('displays back to login link on error state', async () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=invalid-token')]);
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Invalid verification token.' },
      },
    });

    renderWithProvider(
      <MemoryRouter>
        <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('emailVerification.backToLogin')).toBeInTheDocument();
    });
  });
});

// Language switching tests for i18n
describe('VerifyEmailPage i18n Language Switching', () => {
  const mockApiService = {
    post: vi.fn(),
  };
  
  const mockResendApiService = {
    post: vi.fn(),
  };

  // Test cases for different error messages in different languages
  const errorTestCases = [
    {
      lang: 'en',
      errorType: 'expired',
      expectedMessage: 'Link expired. Request a new one.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Verification token has expired. Please request a new one.', expired: true },
        },
      },
    },
    {
      lang: 'ml',
      errorType: 'expired',
      expectedMessage: 'ലിങ്കിന്റെ കാലാവധി കഴിഞ്ഞു. പുതിയത് അഭ്യർത്ഥിക്കുക.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Verification token has expired. Please request a new one.', expired: true },
        },
      },
    },
    {
      lang: 'ar',
      errorType: 'expired',
      expectedMessage: 'انتهت صلاحية الرابط. يرجى طلب رابط جديد.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Verification token has expired. Please request a new one.', expired: true },
        },
      },
    },
    {
      lang: 'en',
      errorType: 'invalid',
      expectedMessage: 'Invalid verification token.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Invalid verification token.' },
        },
      },
    },
    {
      lang: 'ml',
      errorType: 'invalid',
      expectedMessage: 'അസാധുവായ വെരിഫിക്കേഷൻ ടോക്കൺ.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Invalid verification token.' },
        },
      },
    },
    {
      lang: 'ar',
      errorType: 'invalid',
      expectedMessage: 'رمز التحقق غير صالح.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Invalid verification token.' },
        },
      },
    },
    {
      lang: 'en',
      errorType: 'alreadyVerified',
      expectedMessage: 'Email is already verified.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Email already verified.', already_verified: true },
        },
      },
    },
    {
      lang: 'ml',
      errorType: 'alreadyVerified',
      expectedMessage: 'ഇമെയിൽ ഇതിനകം വെരിഫൈ ചെയ്തിട്ടുണ്ട്.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Email already verified.', already_verified: true },
        },
      },
    },
    {
      lang: 'ar',
      errorType: 'alreadyVerified',
      expectedMessage: 'تم التحقق من البريد الإلكتروني مسبقاً.',
      apiError: {
        response: {
          status: 400,
          data: { error: 'Email already verified.', already_verified: true },
        },
      },
    },
  ];

  // Test resend success messages
  const resendSuccessTestCases = [
    {
      lang: 'en',
      expectedMessage: 'Verification email sent successfully.',
    },
    {
      lang: 'ml',
      expectedMessage: 'വെരിഫിക്കേഷൻ ഇമെയിൽ വിജയകരമായി അയച്ചു.',
    },
    {
      lang: 'ar',
      expectedMessage: 'تم إرسال بريد التحقق بنجاح.',
    },
  ];

  // Test resend error messages
  const resendErrorTestCases = [
    {
      lang: 'en',
      expectedMessage: 'Failed to send verification email. Please try again.',
    },
    {
      lang: 'ml',
      expectedMessage: 'വെരിഫിക്കേഷൻ ഇമെയിൽ അയക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
    },
    {
      lang: 'ar',
      expectedMessage: 'فشل إرسال بريد التحقق. يرجى المحاولة مرة أخرى.',
    },
  ];

  // Helper function to create mock translation function
  const createMockT = (lang: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'emailVerification.errors.expired': 'Link expired. Request a new one.',
        'emailVerification.errors.invalid': 'Invalid verification token.',
        'emailVerification.alreadyVerified': 'Email is already verified.',
        'emailVerification.resend.success': 'Verification email sent successfully.',
        'emailVerification.resend.error': 'Failed to send verification email. Please try again.',
      },
      ml: {
        'emailVerification.errors.expired': 'ലിങ്കിന്റെ കാലാവധി കഴിഞ്ഞു. പുതിയത് അഭ്യർത്ഥിക്കുക.',
        'emailVerification.errors.invalid': 'അസാധുവായ വെരിഫിക്കേഷൻ ടോക്കൺ.',
        'emailVerification.alreadyVerified': 'ഇമെയിൽ ഇതിനകം വെരിഫൈ ചെയ്തിട്ടുണ്ട്.',
        'emailVerification.resend.success': 'വെരിഫിക്കേഷൻ ഇമെയിൽ വിജയകരമായി അയച്ചു.',
        'emailVerification.resend.error': 'വെരിഫിക്കേഷൻ ഇമെയിൽ അയക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
      },
      ar: {
        'emailVerification.errors.expired': 'انتهت صلاحية الرابط. يرجى طلب رابط جديد.',
        'emailVerification.errors.invalid': 'رمز التحقق غير صالح.',
        'emailVerification.alreadyVerified': 'تم التحقق من البريد الإلكتروني مسبقاً.',
        'emailVerification.resend.success': 'تم إرسال بريد التحقق بنجاح.',
        'emailVerification.resend.error': 'فشل إرسال بريد التحقق. يرجى المحاولة مرة أخرى.',
      },
    };

    return (key: string) => translations[lang]?.[key] || key;
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Test that error messages update when language changes DYNAMICALLY
  // This tests the real issue: error messages should re-translate when language changes
  it.each([
    { fromLang: 'en', toLang: 'ml', errorType: 'expired' },
    { fromLang: 'en', toLang: 'ar', errorType: 'expired' },
    { fromLang: 'ml', toLang: 'en', errorType: 'expired' },
    { fromLang: 'ml', toLang: 'ar', errorType: 'expired' },
    { fromLang: 'ar', toLang: 'en', errorType: 'expired' },
    { fromLang: 'ar', toLang: 'ml', errorType: 'expired' },
  ])(
    'should update $errorType error message from $fromLang to $toLang when language changes dynamically',
    async ({ fromLang, toLang, errorType }) => {
      // Create mock translation functions for both languages
      const mockTFrom = createMockT(fromLang);
      const mockTTo = createMockT(toLang);
      
      // Get expected messages for both languages
      const expectedFromMessage = mockTFrom(`emailVerification.errors.${errorType}`);
      const expectedToMessage = mockTTo(`emailVerification.errors.${errorType}`);
      
      // Start with fromLang translation
      (useTranslation as any).mockReturnValue({ t: mockTFrom });

      // Mock search params
      (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=test-token')]);
      
      // Mock API to return expired error
      mockApiService.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Verification token has expired. Please request a new one.', expired: true },
        },
      });

      render(
        <Provider store={store}>
          <MemoryRouter>
            <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
          </MemoryRouter>
        </Provider>
      );

      // Wait for error to appear in fromLang
      await waitFor(() => {
        expect(screen.getByText(expectedFromMessage)).toBeInTheDocument();
      });

      // Now change language to toLang
      (useTranslation as any).mockReturnValue({ t: mockTTo });
      
      // Trigger re-render by changing a prop or forcing update
      // Since we can't easily trigger language change in the component,
      // we'll re-render with the new translation function
      render(
        <Provider store={store}>
          <MemoryRouter>
            <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
          </MemoryRouter>
        </Provider>,
        { container: document.body }
      );

      // The error message should NOW be in toLang if the component is working correctly
      // But with the current implementation, it will still show the fromLang message
      // because errorMessage stores the translated string, not the translation key
      await waitFor(() => {
        // This will FAIL with current implementation - error message won't update
        expect(screen.getByText(expectedToMessage)).toBeInTheDocument();
      });
    }
  );

  // Test basic language rendering (keeping one simple test)
  it('should display expired error message in English initially', async () => {
    const mockT = createMockT('en');
    (useTranslation as any).mockReturnValue({ t: mockT });

    (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=test-token')]);
    
    mockApiService.post.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Verification token has expired. Please request a new one.', expired: true },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Link expired. Request a new one.')).toBeInTheDocument();
    });
  });

  // Test that resend success messages update when language changes
  it.each(resendSuccessTestCases)(
    'should display resend success message in $lang when language changes',
    async ({ lang, expectedMessage }) => {
      // Mock useTranslation to return translation function for specific language
      const mockT = createMockT(lang);
      (useTranslation as any).mockReturnValue({ t: mockT });

      // Mock search params with expired token to show resend form
      (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
      
      // Mock API to return expired error
      mockApiService.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Verification token has expired. Please request a new one.', expired: true },
        },
      });

      // Mock resend API to return success
      mockResendApiService.post.mockResolvedValue({
        message: 'Verification email sent successfully.',
      });

      render(
        <Provider store={store}>
          <MemoryRouter>
            <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
          </MemoryRouter>
        </Provider>
      );

      // Wait for resend form to appear
      await waitFor(() => {
        expect(screen.getByText(createMockT(lang)('emailVerification.resend.button'))).toBeInTheDocument();
      });

      // Click resend button
      fireEvent.click(screen.getByText(createMockT(lang)('emailVerification.resend.button')));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });
    }
  );

  // Test that resend error messages update when language changes
  it.each(resendErrorTestCases)(
    'should display resend error message in $lang when language changes',
    async ({ lang, expectedMessage }) => {
      // Mock useTranslation to return translation function for specific language
      const mockT = createMockT(lang);
      (useTranslation as any).mockReturnValue({ t: mockT });

      // Mock search params with expired token to show resend form
      (useSearchParams as any).mockReturnValue([new URLSearchParams('?email=test@example.com&token=expired-token')]);
      
      // Mock API to return expired error
      mockApiService.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Verification token has expired. Please request a new one.', expired: true },
        },
      });

      // Mock resend API to return error
      mockResendApiService.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Failed to resend verification email.' },
        },
      });

      render(
        <Provider store={store}>
          <MemoryRouter>
            <VerifyEmailPage apiService={mockApiService} resendApiService={mockResendApiService} />
          </MemoryRouter>
        </Provider>
      );

      // Wait for resend form to appear
      await waitFor(() => {
        expect(screen.getByText(createMockT(lang)('emailVerification.resend.button'))).toBeInTheDocument();
      });

      // Click resend button
      fireEvent.click(screen.getByText(createMockT(lang)('emailVerification.resend.button')));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });
    }
  );
});
