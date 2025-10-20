import { Component } from "react";
import tw, { styled } from "twin.macro";
import { ApiService } from "../services/apiService";
import { LoginRequestBody, validateLogin } from "../utils/validationRules";
import { withTranslation, WithTranslation } from "react-i18next";
import i18n from "../locale/i18n";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/actions";

const FormWrapper = tw.div`min-h-[80vh] flex items-center justify-center bg-gray-100 dark:bg-dark-primary`;

export const Form = styled.form.attrs((props: { lang?: string }) => ({
  lang: props.lang || "en",
}))<{ lang?: string }>`
  ${tw`w-full p-4 bg-white rounded-lg shadow-md dark:bg-dark-secondary`}
  ${({ lang }) =>
    lang === "ml" ? tw`max-w-xl` : lang === "ar" ? tw`max-w-md` : tw`max-w-sm`}
`;

const Title = tw.h2`text-xl font-bold mb-3 dark:text-dark-text`;
const Label = tw.label`block text-gray-700 dark:text-dark-text font-medium mb-1`;
const Input = tw.input`w-full px-3 py-0.5 border border-gray-300 dark:border-dark-accent rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-dark-primary dark:text-dark-text`;
const Button = styled.button<{ disabled?: boolean }>(({ disabled }) => [
  tw`px-4 py-2 mt-2 text-white transition-all bg-blue-500 rounded hover:bg-blue-600`,
  disabled && tw`bg-gray-400 cursor-not-allowed hover:bg-gray-400`,
]);

const ErrorWrapper = tw.div`relative mb-6 min-h-[20px]`;
const ErrorMessage = tw.div`absolute top-full left-0 mt-1 text-red-700 text-sm min-h-[20px] leading-tight`;

const ApiErrorMessage = tw.div`mb-4 p-3 text-red-700 bg-red-100 rounded text-center`;

interface LoginResponse {
  id: number;
  username: string;
  access: string;
  refresh: string;
}

interface ErrorResponse {
  validationErrors?: Record<string, string>;
  apiErrorMessage?: string;
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

      // Dispatch loginSuccess action with id, username, access and refresh tokens
      this.props.dispatch(
        loginSuccess({
          id: response.id,
          username: response.username,
          access: response.access,
          refresh: response.refresh,
        })
      );

      // Redirect using navigate prop
      this.props.navigate("/"); // Redirect to home page
    } catch (error) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      if (apiError.response?.data) {
        const { validationErrors, apiErrorMessage } = apiError.response.data;
        if (apiErrorMessage) {
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

// Create a functional wrapper component to use hooks
const LoginPageWrapper: React.FC<
  Omit<LoginPageProps, "dispatch" | "navigate">
> = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Pass dispatch and navigate as props to the class component
  return <LoginPage {...props} dispatch={dispatch} navigate={navigate} />;
};

// Apply withTranslation to the wrapper component
export default withTranslation()(LoginPageWrapper);
