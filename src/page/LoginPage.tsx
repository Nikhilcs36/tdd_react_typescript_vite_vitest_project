import { Component } from "react";
import { ApiService } from "../services/apiService";
import { LoginRequestBody, validateLogin } from "../utils/validationRules";
import { encryptWithPublicKey, fetchPublicKey } from "../utils/encryption";
import { withTranslation, WithTranslation } from "react-i18next";
import { useNavigate} from "react-router-dom";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/actions";
import { resetDashboardState } from "../store/dashboardSlice";
import { startTokenRefreshTimer } from "../services/tokenService";
import {
  FormWrapper,
  Form,
  Title,
  Label,
  Input,
  Button,
  ErrorWrapper,
  ErrorMessage,
  ApiErrorMessage,
  SuccessMessage,
  ForgotPasswordLink,
} from "./LoginPage.styles";

interface LoginResponse {
  id: number;
  username: string;
  access: string;
  refresh: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface ErrorResponse {
  validationErrors?: Record<string, string>;
  apiErrorMessage?: string;
  nonFieldErrors?: string[];
  non_field_errors?: string[]; // Keep for backward compatibility
  message?: string; // Backend message field for standardized errors
}

interface LoginState {
  email: string;
  password: string;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  apiErrorMessage: string;
  touched: {
    email: boolean;
    password: boolean;
  };
  showForgotPassword: boolean;
  forgotPasswordSubmitting: boolean;
  forgotPasswordSuccess: boolean;
  forgotPasswordApiError: string;
  showEmailNotVerified: boolean;
  resendVerificationSending: boolean;
  resendVerificationSuccess: boolean;
}

// Add dispatch and navigate to props interface
interface LoginPageProps extends WithTranslation {
  apiService: ApiService<LoginRequestBody>;
  dispatch: ReturnType<typeof useDispatch>;
  navigate: ReturnType<typeof useNavigate>;
}

class LoginPage extends Component<LoginPageProps, LoginState> {
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  componentWillUnmount() {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  state: LoginState = {
    email: "",
    password: "",
    isSubmitting: false,
    validationErrors: {},
    apiErrorMessage: "",
    touched: {
      email: false,
      password: false,
    },
    showForgotPassword: false,
    forgotPasswordSubmitting: false,
    forgotPasswordSuccess: false,
    forgotPasswordApiError: "",
    showEmailNotVerified: false,
    resendVerificationSending: false,
    resendVerificationSuccess: false,
  };

  validateFields = () => {
    const { email, password, touched } = this.state;
    const errors = validateLogin({ email, password });

    // Keep only errors for touched fields
    const filteredErrors = Object.keys(errors).reduce((acc, key) => {
      if (touched[key as keyof LoginState["touched"]]) {
        acc[key] = errors[key];
      }
      return acc;
    }, {} as Record<string, string>);

    this.setState({ validationErrors: filteredErrors });
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    if (id === "email" || id === "password") {
      this.setState(
        (prev) =>
          ({
            [id]: value,
            touched: {
              ...prev.touched,
              [id]: true,
            },
            apiErrorMessage: "",
            showForgotPassword: prev.showForgotPassword,
            forgotPasswordSuccess: false,
            forgotPasswordApiError: "",
            showEmailNotVerified: false,
            resendVerificationSending: false,
            resendVerificationSuccess: false,
          } as Pick<
            LoginState,
            | "email"
            | "password"
            | "touched"
            | "apiErrorMessage"
            | "showForgotPassword"
            | "forgotPasswordSuccess"
            | "forgotPasswordApiError"
            | "showEmailNotVerified"
            | "resendVerificationSending"
            | "resendVerificationSuccess"
          >),
        this.validateFields
      );
    }
  };

  get isDisabled() {
    const { email, password, validationErrors, isSubmitting } = this.state;
    return (
      !email ||
      !password ||
      Object.keys(validationErrors).length > 0 ||
      isSubmitting
    );
  }

  handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    this.setState({ isSubmitting: true, apiErrorMessage: "" });

    try {
      const { email, password } = this.state;
      let requestBody: LoginRequestBody = { email, password };

      // Attempt to encrypt the password using the backend's public key
      try {
        const publicKey = await fetchPublicKey();
        const encryptedPassword = await encryptWithPublicKey(publicKey, password);
        requestBody = { email, encrypted_password: encryptedPassword };
      } catch (encryptionError) {
        console.warn("Password encryption failed, falling back to plaintext:", encryptionError);
      }

      const response = await this.props.apiService.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        requestBody
      );

      this.props.dispatch(
        loginSuccess({
          id: response.id,
          username: response.username,
          access: response.access,
          refresh: response.refresh,
          is_staff: response.is_staff,
          is_superuser: response.is_superuser,
        })
      );

      startTokenRefreshTimer();
      this.props.dispatch(resetDashboardState());
      this.props.navigate("/");
    } catch (error) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      if (apiError.response?.data) {
        const { validationErrors, apiErrorMessage, nonFieldErrors, message } = apiError.response.data;

        // Handle specific backend message for unverified email during login
        if (nonFieldErrors && nonFieldErrors.length > 0 && nonFieldErrors[0] === "email_not_verified") {
          this.setState({ apiErrorMessage: "login.errors.email_not_verified", showEmailNotVerified: true });
        } else if (message === "Please verify your email before logging in.") {
          this.setState({ apiErrorMessage: "login.errors.email_not_verified", showEmailNotVerified: true });
        } else if (nonFieldErrors && nonFieldErrors.length > 0) {
          this.setState({ apiErrorMessage: `login.errors.${nonFieldErrors[0]}` });
        } else if (apiErrorMessage) {
          this.setState({ apiErrorMessage });
        } else if (validationErrors) {
          this.setState({ validationErrors });
        }
      } else {
        this.setState({
          apiErrorMessage: "login.errors.generic",
        });
      }
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleForgotPasswordClick = () => {
    this.setState({
      showForgotPassword: true,
      forgotPasswordSuccess: false,
      forgotPasswordApiError: "",
      forgotPasswordSubmitting: false,
      resendVerificationSuccess: false,
      resendVerificationSending: false,
      showEmailNotVerified: false,
      apiErrorMessage: "",
    });
  };

  handleBackToLogin = () => {
    this.setState({
      showForgotPassword: false,
      forgotPasswordSuccess: false,
      forgotPasswordApiError: "",
      forgotPasswordSubmitting: false,
      email: "",
      password: "",
      apiErrorMessage: "",
      validationErrors: {},
      touched: { email: false, password: false },
      showEmailNotVerified: false,
      resendVerificationSending: false,
      resendVerificationSuccess: false,
    });
  };

  handleSendResetLink = async () => {
    this.setState({ forgotPasswordSubmitting: true, forgotPasswordApiError: "", showEmailNotVerified: false });

    try {
      await this.props.apiService.post(API_ENDPOINTS.PASSWORD_RESET, {
        email: this.state.email,
      } as LoginRequestBody);
      this.setState({ forgotPasswordSuccess: true });

      this.redirectTimer = setTimeout(() => {
        this.setState({
          showForgotPassword: false,
          forgotPasswordSuccess: false,
          forgotPasswordApiError: "",
          email: "",
          password: "",
          apiErrorMessage: "",
          validationErrors: {},
          touched: { email: false, password: false },
          showEmailNotVerified: false,
          resendVerificationSending: false,
          resendVerificationSuccess: false,
        });
      }, 3000);
    } catch (error) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      if (apiError.response?.data) {
        const { message, apiErrorMessage, nonFieldErrors } = apiError.response.data;

        if (message === "Please verify your email before resetting password.") {
          this.setState({ forgotPasswordApiError: "forgotPassword.errors.email_not_verified", showEmailNotVerified: true });
        } else if (nonFieldErrors && nonFieldErrors.length > 0) {
          this.setState({ forgotPasswordApiError: `forgotPassword.errors.${nonFieldErrors[0]}` });
        } else if (apiErrorMessage) {
          this.setState({ forgotPasswordApiError: apiErrorMessage });
        } else {
          this.setState({ forgotPasswordApiError: "login.errors.generic" });
        }
      } else {
        this.setState({ forgotPasswordApiError: "login.errors.generic" });
      }
    } finally {
      this.setState({ forgotPasswordSubmitting: false });
    }
  };

  handleResendVerification = async () => {
    this.setState({ resendVerificationSending: true, resendVerificationSuccess: false });

    try {
      await this.props.apiService.post(API_ENDPOINTS.RESEND_VERIFICATION, {
        email: this.state.email,
      });
      this.setState({ resendVerificationSuccess: true, resendVerificationSending: false });
    } catch {
      this.setState({ resendVerificationSending: false });
    }
  };

  render() {
    const {
      validationErrors,
      apiErrorMessage,
      showForgotPassword,
      forgotPasswordSubmitting,
      forgotPasswordSuccess,
      forgotPasswordApiError,
      showEmailNotVerified,
      resendVerificationSending,
      resendVerificationSuccess,
      email,
    } = this.state;
    const { t } = this.props;

    return (
      <FormWrapper data-testid="login-page">
        <Form onSubmit={showForgotPassword ? (e) => { e.preventDefault(); this.handleSendResetLink(); } : this.handleSubmit} autoComplete="off">
          <Title>{showForgotPassword ? t("forgotPassword.title") : t("login.title")}</Title>

          {/* API Error Message */}
          {showForgotPassword && forgotPasswordApiError && (
            <ApiErrorMessage data-testid="forgot-password-api-error">
              {t(forgotPasswordApiError)}
            </ApiErrorMessage>
          )}
          {!showForgotPassword && apiErrorMessage && (
            <ApiErrorMessage data-testid="api-error">
              {t(apiErrorMessage)}
            </ApiErrorMessage>
          )}

          {/* Resend Verification Link - shown when email not verified error occurs (works in both login and forgot password modes) */}
          {showEmailNotVerified && !resendVerificationSuccess && (
            <div data-testid={showForgotPassword ? "resend-verification-link" : "login-resend-verification-link"}>
              <ForgotPasswordLink
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  this.handleResendVerification();
                }}
              >
                {resendVerificationSending ? t("emailVerification.resend.sending") : t("emailVerification.resend.button")}
              </ForgotPasswordLink>
            </div>
          )}

          {/* Resend Verification Success Message */}
          {resendVerificationSuccess && (
            <SuccessMessage data-testid={showForgotPassword ? "resend-verification-success" : "login-resend-verification-success"}>
              {t("emailVerification.resend.success")}
            </SuccessMessage>
          )}

          {/* Success message */}
          {showForgotPassword && forgotPasswordSuccess && (
            <SuccessMessage data-testid="forgot-password-success">
              {t("forgotPassword.success")}
            </SuccessMessage>
          )}

          {/* Email Field */}
          <ErrorWrapper>
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              value={this.state.email}
              onChange={this.handleChange}
              autoComplete="off"
              data-testid="email"
            />
            {validationErrors.email && !showForgotPassword && (
              <ErrorMessage data-testid="email-error">
                {t(`login.errors.${validationErrors.email}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Password Field - only shown in login mode */}
          {!showForgotPassword && (
            <ErrorWrapper>
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                onChange={this.handleChange}
                data-testid="password"
              />
              {validationErrors.password && (
                <ErrorMessage data-testid="password-error">
                  {t(`login.errors.${validationErrors.password}`)}
                </ErrorMessage>
              )}
            </ErrorWrapper>
          )}

          {/* Submit Button or Send Reset Link */}
          {!showForgotPassword && (
            <Button disabled={this.isDisabled}>{t("login.submit")}</Button>
          )}

          {showForgotPassword && !forgotPasswordSuccess && (
            <Button disabled={!email || forgotPasswordSubmitting}>
              {t("forgotPassword.submit")}
            </Button>
          )}

          {/* Forgot Password Link - shown after login failure (but not for email not verified) */}
          {!showForgotPassword && apiErrorMessage && !showEmailNotVerified && (
            <ForgotPasswordLink
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                this.handleForgotPasswordClick();
              }}
            >
              {t("login.forgotPassword")}
            </ForgotPasswordLink>
          )}

          {/* Back to Login link */}
          {showForgotPassword && !forgotPasswordSuccess && (
            <ForgotPasswordLink
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                this.handleBackToLogin();
              }}
            >
              {t("forgotPassword.backToLogin")}
            </ForgotPasswordLink>
          )}
        </Form>
      </FormWrapper>
    );
  }
}

function LoginPageWrapper(props: Omit<LoginPageProps, "dispatch" | "navigate">) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return <LoginPage {...props} dispatch={dispatch} navigate={navigate} />;
};

const TranslatedLoginPage = withTranslation()(LoginPageWrapper);
export default TranslatedLoginPage;