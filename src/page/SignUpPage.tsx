import { Component } from "react";
import { ApiService } from "../services/apiService";
import { SignUpRequestBody, validateSignUp } from "../utils/validationRules";
import { withTranslation, WithTranslation } from "react-i18next";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { useNavigate } from "react-router-dom";
import {
  FormWrapper,
  Form,
  Title,
  Label,
  Input,
  Button,
  SuccessMessage,
  ErrorWrapper,
  ErrorMessage
} from "./SignUpPage.styles";

interface SignUpState {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
  isSubmitting: boolean;
  successMessage: boolean;
  validationErrors: Record<string, string>;
  touched: {
    username: boolean;
    email: boolean;
    password: boolean;
    passwordRepeat: boolean;
  };
}

interface SignUpPageProps extends WithTranslation {
  apiService: ApiService<SignUpRequestBody>;
  navigate?: (path: string) => void;
}

interface SignUpResponse {
  id: number;
  username: string;
  email: string;
  image: string | null;
}

class SignUpPage extends Component<SignUpPageProps, SignUpState> {
  private validationTimeout: number | null = null;
  private redirectTimeout: number | null = null;

  state: SignUpState = {
    username: "",
    email: "",
    password: "",
    passwordRepeat: "",
    isSubmitting: false,
    successMessage: false,
    validationErrors: {},
    touched: {
      username: false,
      email: false,
      password: false,
      passwordRepeat: false,
    },
  };

  componentWillUnmount() {
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    // Explicitly define the state update type
    const update: Partial<SignUpState> = { [id]: value };

    this.setState(update as Pick<SignUpState, keyof SignUpState>, () => {
      if (this.validationTimeout) clearTimeout(this.validationTimeout);

      this.validationTimeout = window.setTimeout(() => {
        this.setState(
          (prev) => ({
            touched: { ...prev.touched, [id]: true }, // Only mark current field as touched
            validationErrors: {},
          }),
          this.validateClientSide
        );
      }, 1000); // Reduced debounce time to 1000ms
    });
  };

  validateClientSide = () => {
    const { username, email, password, passwordRepeat, touched } = this.state;
    const errors = validateSignUp({
      username,
      email,
      password,
      passwordRepeat,
    });

    // Filter errors to only show for touched fields
    const filteredErrors = Object.keys(errors).reduce((acc, key) => {
      if (touched[key as keyof typeof touched]) {
        acc[key] = errors[key];
      }
      return acc;
    }, {} as Record<string, string>);

    this.setState({ validationErrors: filteredErrors });
  };

  isDisabled = () => {
    const {
      username,
      email,
      password,
      passwordRepeat,
      isSubmitting,
      validationErrors,
    } = this.state;
    const hasErrors = Object.keys(validationErrors).length > 0;
    return (
      !username ||
      !email ||
      !password ||
      !passwordRepeat ||
      password !== passwordRepeat ||
      hasErrors ||
      isSubmitting
    );
  };

  submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.setState(
      {
        isSubmitting: true,
        successMessage: false,
        validationErrors: {},
        touched: {
          // Mark all fields as touched on submit
          username: true,
          email: true,
          password: true,
          passwordRepeat: true,
        },
      },
      async () => {
        try {
          const { username, email, password, passwordRepeat } = this.state;
          const body = { username, email, password, passwordRepeat };

          await this.props.apiService.post<SignUpResponse>(
            API_ENDPOINTS.SIGNUP,
            body
          );
          this.setState({ successMessage: true });
          
          // Redirect to login page after 5 seconds
          if (this.props.navigate) {
            this.redirectTimeout = window.setTimeout(() => {
              this.props.navigate!("/login");
            }, 5000);
          }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { validationErrors?: Record<string, string> } } };
      const validationErrors = apiError.response?.data?.validationErrors || {};
      this.setState({ validationErrors, isSubmitting: false });
    }
      }
    );
  };

  render() {
    const { successMessage, validationErrors } = this.state;
    const { t } = this.props;

    return (
      <FormWrapper data-testid="signup-page">
        <Form autoComplete="off" onSubmit={this.submit}>
          <Title>{t("signup.title")}</Title>{" "}
          {/* title are mention in i18./n.ts */}
          {/* Username Field */}
          <ErrorWrapper>
            <Label htmlFor="username">{t("signup.username")}</Label>
            <Input
              id="username"
              onChange={this.handleChange}
              data-testid="username"
              autoComplete="off"
            />
            {validationErrors.username && (
              <ErrorMessage data-testid="username-error">
                {t(`signup.errors.${validationErrors.username}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>
          {/* Email Field */}
          <ErrorWrapper>
            <Label htmlFor="email">{t("signup.email")}</Label>
            <Input
              id="email"
              onChange={this.handleChange}
              data-testid="email"
              autoComplete="off"
            />
            {validationErrors.email && (
              <ErrorMessage data-testid="email-error">
                {t(`signup.errors.${validationErrors.email}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>
          {/* Password Field */}
          <ErrorWrapper>
            <Label htmlFor="password">{t("signup.password")}</Label>
            <Input
              id="password"
              type="password"
              onChange={this.handleChange}
              data-testid="password"
            />
            {validationErrors.password && (
              <ErrorMessage data-testid="password-error">
                {t(`signup.errors.${validationErrors.password}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>
          {/* Password Repeat Field */}
          <ErrorWrapper>
            <Label htmlFor="passwordRepeat">{t("signup.passwordRepeat")}</Label>
            <Input
              id="passwordRepeat"
              type="password"
              onChange={this.handleChange}
              data-testid="passwordRepeat"
            />
            {validationErrors.passwordRepeat && (
              <ErrorMessage data-testid="passwordRepeat-error">
                {t(`signup.errors.${validationErrors.passwordRepeat}`)}
              </ErrorMessage>
            )}
          </ErrorWrapper>
          <Button disabled={this.isDisabled()}>{t("signup.submit")}</Button>
          {successMessage && (
            <SuccessMessage data-testid="success-message">
              <p>{t("signup.success.message")}</p>
              <p>{t("signup.success.verification")}</p>
            </SuccessMessage>
          )}
        </Form>
      </FormWrapper>
    );
  }
}

// Wrapper component to inject navigate prop - Named for Fast Refresh
function SignUpPageWrapper(props: Omit<SignUpPageProps, "navigate">) {
   
  let navigate: ((path: string) => void) | undefined;
  
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch (_e) {
    // useNavigate fails in tests without Router context
    // In that case, navigate remains undefined
    navigate = undefined;
  }
  
  return <SignUpPage {...props} navigate={navigate} />;
};

// Export both the class component (for tests) and the wrapper (for app)
export { SignUpPage };
const TranslatedSignUpPage = withTranslation()(SignUpPageWrapper);
export default TranslatedSignUpPage;
