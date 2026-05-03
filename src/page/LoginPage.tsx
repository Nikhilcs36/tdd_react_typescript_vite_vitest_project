import { Component } from "react";
import { ApiService } from "../services/apiService";
import { LoginRequestBody, validateLogin } from "../utils/validationRules";
import { withTranslation, WithTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
            apiErrorMessage: "", // Clear API error on input change
            showForgotPassword: false, // Reset forgot password mode when editing
            forgotPasswordSuccess: false,
            forgotPasswordApiError: "",
          } as Pick<
            LoginState,
            "email" | "password" | "touched" | "apiErrorMessage" | "showForgotPassword" | "forgotPasswordSuccess" | "forgotPasswordApiError"
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
      const response = await this.props.apiService.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        {
          email,
          password,
        }
      );

      // Dispatch loginSuccess action with id, username, access, refresh, and role fields
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

      // Start proactive token refresh timer
      startTokenRefreshTimer();

      // Reset dashboard state to ensure Recent Activity shows dropdown's first user
      this.props.dispatch(resetDashboardState());

      // Redirect using navigate prop
      this.props.navigate("/"); // Redirect to home page
    } catch (error) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      if (apiError.response?.data) {
        const { validationErrors, apiErrorMessage, nonFieldErrors } = apiError.response.data;

        // Handle Django nonFieldErrors format (standardized by errorService)
        if (nonFieldErrors && nonFieldErrors.length > 0) {
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
    });
  };

  handleSendResetLink = async () => {
    this.setState({ forgotPasswordSubmitting: true, forgotPasswordApiError: "" });

    try {
      await this.props.apiService.post(API_ENDPOINTS.PASSWORD_RESET, {
        email: this.state.email,
      } as LoginRequestBody);
      this.setState({ forgotPasswordSuccess: true });

      // After 3 seconds, reset state to show the login form
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
        });
      }, 3000);
    } catch (error) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      if (apiError.response?.data) {
        const { apiErrorMessage, nonFieldErrors } = apiError.response.data;
        if (nonFieldErrors && nonFieldErrors.length > 0) {
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

  render() {
    const {
      validationErrors,
      apiErrorMessage,
      showForgotPassword,
      forgotPasswordSubmitting,
      forgotPasswordSuccess,
      forgotPasswordApiError,
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

          {/* Success message */}
          {showForgotPassword && forgotPasswordSuccess && (
            <ApiErrorMessage as="div" data-testid="forgot-password-success">
              {t("forgotPassword.success")}
            </ApiErrorMessage>
          )}

          {/* Email Field - shown in both modes */}
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

          {/* Forgot Password Link - shown after login failure */}
          {!showForgotPassword && apiErrorMessage && (
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

          {/* Back to Login link - shown in forgot password mode */}
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

// Create a functional wrapper component to use hooks - Named for Fast Refresh
function LoginPageWrapper(props: Omit<LoginPageProps, "dispatch" | "navigate">) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Pass dispatch and navigate as props to the class component
  return <LoginPage {...props} dispatch={dispatch} navigate={navigate} />;
};

// Apply withTranslation to the wrapper component
const TranslatedLoginPage = withTranslation()(LoginPageWrapper);
export default TranslatedLoginPage;