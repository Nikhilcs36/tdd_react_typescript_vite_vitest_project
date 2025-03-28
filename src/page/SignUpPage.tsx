import { Component } from "react";
import tw, { styled } from "twin.macro";
import { ApiService } from "../services/apiService";
import { validateSignUp } from "../utils/validationRules";
import { withTranslation, WithTranslation } from "react-i18next";
import i18n from "../locale/i18n";

const FormWrapper = tw.div`min-h-[80vh] flex items-center justify-center bg-gray-100`;

//Dynamic Form styled width
export const Form = styled.form.attrs((props: { lang?: string }) => ({
  lang: props.lang || "en",
}))<{ lang?: string }>`
  ${tw`w-full p-4 bg-white rounded-lg shadow-md`}
  ${({ lang }) =>
    lang === "ml" ? tw`max-w-xl` : lang === "ar" ? tw`max-w-md` : tw`max-w-sm`}
`;

const Title = tw.h2`text-xl font-bold mb-3`;
const Label = tw.label`block text-gray-700 font-medium mb-1`;
const Input = tw.input`w-full px-3 py-0.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`;

const Button = styled.button<{ disabled?: boolean }>(({ disabled }) => [
  tw`px-4 py-2 mt-2 text-white transition-all bg-blue-500 rounded hover:bg-blue-600`,
  disabled && tw`bg-gray-400 cursor-not-allowed hover:bg-gray-400`,
]);

const SuccessMessage = tw.div`mt-3 p-3 text-green-700 bg-green-100 rounded text-center`;

const ErrorWrapper = tw.div`relative mb-6 min-h-[20px]`;
const ErrorMessage = tw.div`absolute top-full left-0 mt-1 text-red-700 text-sm min-h-[20px] leading-tight`;

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
  apiService: ApiService;
}

interface SignUpResponse {
  message: string;
}

class SignUpPage extends Component<SignUpPageProps, SignUpState> {
  private validationTimeout: number | null = null;

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
            "/api/1.0/users",
            body
          );
          this.setState({ successMessage: true });
        } catch (error: any) {
          const validationErrors = error.response?.data?.validationErrors || {};
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
        <Form lang={i18n.language} autoComplete="off" onSubmit={this.submit}>
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

export default withTranslation()(SignUpPage);
