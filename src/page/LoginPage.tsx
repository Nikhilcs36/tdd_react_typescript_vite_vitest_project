import { Component } from "react";
import { ApiService } from "../services/apiService";
import { LoginRequestBody, validateLogin } from "../utils/validationRules";
import { withTranslation, WithTranslation } from "react-i18next";
import i18n from "../locale/i18n";
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
  ApiErrorMessage
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
}

// Add dispatch and navigate to props interface
interface LoginPageProps extends WithTranslation {
  apiService: ApiService<LoginRequestBody>;
  dispatch: ReturnType<typeof useDispatch>;
  navigate: ReturnType<typeof useNavigate>;
}

class LoginPage extends Component<LoginPageProps, LoginState> {
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
          } as Pick<
            LoginState,
            "email" | "password" | "touched" | "apiErrorMessage"
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

  render() {
    const { validationErrors, apiErrorMessage } = this.state;
    const { t } = this.props;

    return (
      <FormWrapper data-testid="login-page">
        <Form
          lang={i18n.language}
          onSubmit={this.handleSubmit}
          autoComplete="off"
        >
          <Title>{t("login.title")}</Title>

          {/* API Error Message (e.g., "Invalid credentials") */}
          {apiErrorMessage && (
            <ApiErrorMessage data-testid="api-error">
              {t(apiErrorMessage)}
            </ApiErrorMessage>
          )}

          {/* Email Field */}
          <ErrorWrapper>
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              onChange={this.handleChange}
              autoComplete="off"
              data-testid="email"
            />
            {validationErrors.email && (
              <ErrorMessage data-testid="email-error">
                {t(`login.errors.${validationErrors.email}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Password Field */}
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

          {/* Submit Button */}
          <Button disabled={this.isDisabled}>{t("login.submit")}</Button>
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
