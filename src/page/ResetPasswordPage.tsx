import { Component } from "react";
import { ApiService } from "../services/apiService";
import { ResetPasswordRequestBody, validateResetPassword } from "../utils/validationRules";
import { withTranslation, WithTranslation } from "react-i18next";
import { useNavigate, Link, useParams } from "react-router-dom";
import { API_ENDPOINTS } from "../services/apiEndpoints";
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
  LinkWrapper,
} from "../page/ResetPasswordPage.styles";

interface ResetPasswordState {
  password: string;
  passwordRepeat: string;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  apiErrorMessage: string;
  isSuccess: boolean;
  touched: {
    password: boolean;
    passwordRepeat: boolean;
  };
}

interface ResetPasswordProps extends WithTranslation {
  apiService: ApiService<ResetPasswordRequestBody>;
  navigate: ReturnType<typeof useNavigate>;
  token: string;
}

class ResetPasswordPage extends Component<ResetPasswordProps, ResetPasswordState> {
  state: ResetPasswordState = {
    password: "",
    passwordRepeat: "",
    isSubmitting: false,
    validationErrors: {},
    apiErrorMessage: "",
    isSuccess: false,
    touched: {
      password: false,
      passwordRepeat: false,
    },
  };

  validateFields = () => {
    const { password, passwordRepeat, touched } = this.state;
    const errors = validateResetPassword({ password, passwordRepeat });

    // Keep only errors for touched fields
    const filteredErrors = Object.keys(errors).reduce((acc, key) => {
      if (touched[key as keyof ResetPasswordState["touched"]]) {
        acc[key] = errors[key];
      }
      return acc;
    }, {} as Record<string, string>);

    this.setState({ validationErrors: filteredErrors });
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const field = id as "password" | "passwordRepeat";

    if (field === "password" || field === "passwordRepeat") {
      this.setState(
        (prev) =>
          ({
            [field]: value,
            touched: {
              ...prev.touched,
              [field]: true,
            },
            apiErrorMessage: "", // Clear API error on input change
          } as Pick<
            ResetPasswordState,
            "password" | "passwordRepeat" | "touched" | "apiErrorMessage"
          >),
        this.validateFields
      );
    }
  };

  get isDisabled() {
    const { password, passwordRepeat, validationErrors, isSubmitting } = this.state;
    return (
      !password ||
      !passwordRepeat ||
      Object.keys(validationErrors).length > 0 ||
      isSubmitting
    );
  }

  handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    this.setState({ isSubmitting: true, apiErrorMessage: "", isSuccess: false });

    try {
      const { password, passwordRepeat } = this.state;
      const { token } = this.props;
      await this.props.apiService.post(
        API_ENDPOINTS.RESET_PASSWORD(token),
        {
          password,
          passwordRepeat,
        }
      );

      this.setState({ isSuccess: true });
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string; nonFieldErrors?: string[]; validationErrors?: Record<string, string> } } };
      if (apiError.response?.data) {
        const errorData = apiError.response.data;
        
        // Handle specific error messages from the standardized error format
        if (errorData.message === "Invalid password reset token.") {
          this.setState({ apiErrorMessage: "resetPassword.errors.invalid_token" });
        } else if (errorData.message === "Invalid or expired password reset token.") {
          this.setState({ apiErrorMessage: "resetPassword.errors.expired_token" });
        } else if (errorData.nonFieldErrors && errorData.nonFieldErrors.length > 0) {
          this.setState({ apiErrorMessage: "resetPassword.errors.generic" });
        } else {
          this.setState({ apiErrorMessage: "resetPassword.errors.generic" });
        }
      } else {
        this.setState({
          apiErrorMessage: "resetPassword.errors.generic",
        });
      }
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  render() {
    const { validationErrors, apiErrorMessage, isSuccess } = this.state;
    const { t } = this.props;

    if (isSuccess) {
      return (
        <FormWrapper data-testid="reset-password-page">
          <Form>
            <Title>{t("resetPassword.title")}</Title>
            <SuccessMessage data-testid="success-message">
              {t("resetPassword.success")}
            </SuccessMessage>
            <LinkWrapper>
              <Link to="/login">{t("resetPassword.goToLogin")}</Link>
            </LinkWrapper>
          </Form>
        </FormWrapper>
      );
    }

    return (
      <FormWrapper data-testid="reset-password-page">
        <Form
          onSubmit={this.handleSubmit}
          autoComplete="off"
        >
          <Title>{t("resetPassword.title")}</Title>

          {/* API Error Message */}
          {apiErrorMessage && (
            <ApiErrorMessage data-testid="api-error">
              {t(apiErrorMessage)}
            </ApiErrorMessage>
          )}

          {/* Password Field */}
          <ErrorWrapper>
            <Label htmlFor="password">{t("resetPassword.password")}</Label>
            <Input
              id="password"
              type="password"
              onChange={this.handleChange}
              autoComplete="new-password"
              data-testid="password"
            />
            {validationErrors.password && (
              <ErrorMessage data-testid="password-error">
                {t(`resetPassword.errors.${validationErrors.password}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Password Repeat Field */}
          <ErrorWrapper>
            <Label htmlFor="passwordRepeat">{t("resetPassword.passwordRepeat")}</Label>
            <Input
              id="passwordRepeat"
              type="password"
              onChange={this.handleChange}
              autoComplete="new-password"
              data-testid="passwordRepeat"
            />
            {validationErrors.passwordRepeat && (
              <ErrorMessage data-testid="passwordRepeat-error">
                {t(`resetPassword.errors.${validationErrors.passwordRepeat}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Submit Button */}
          <Button disabled={this.isDisabled}>{t("resetPassword.submit")}</Button>
        </Form>
      </FormWrapper>
    );
  }
}

// Create a functional wrapper component to use hooks - Named for Fast Refresh
function ResetPasswordPageWrapper(props: Omit<ResetPasswordProps, "navigate" | "token">) {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  return <ResetPasswordPage {...props} navigate={navigate} token={token || ""} />;
}

// Apply withTranslation to the wrapper component
const TranslatedResetPasswordPage = withTranslation()(ResetPasswordPageWrapper);
export default TranslatedResetPasswordPage;