import { Component } from "react";
import tw, { styled } from "twin.macro";
import { ApiService } from "../services/apiService";
import { validateSignUp } from "../utils/validationRules";

const FormWrapper = tw.div`min-h-screen flex items-center justify-center bg-gray-100`;
const Form = tw.form`bg-white p-4 rounded-lg shadow-md w-full max-w-sm`;
const Title = tw.h2`text-xl font-bold mb-3`;
const Label = tw.label`block text-gray-700 font-medium mb-1`;
const Input = tw.input`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`;

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
  successMessage: string | boolean | null;
  validationErrors: Record<string, string>;
  touched: {
    username: boolean;
    email: boolean;
    password: boolean;
    passwordRepeat: boolean;
  };
}

interface SignUpPageProps {
  apiService: ApiService;
}

const errorMessages: Record<string, string> = {
  "Username cannot be null": "Username is required.",
  "Must have min 4 and max 32 characters": "Username must be 4-32 characters.",
  "E-mail cannot be null": "Email is required.",
  "E-mail is not valid": "Enter a valid email (e.g., user@example.com).",
  "E-mail in use": "Email is already in use.",
  "Password cannot be null": "Password is required.",
  "Password must have at least 6 characters": "Password must be 6+ characters.",
  "Password must have at least 1 uppercase, 1 lowercase letter and 1 number":
    "Use upper, lower, and a number.",
  password_repeat_null: "Confirm your password.",
  password_mismatch: "Passwords don't match.",
};

class SignUpPage extends Component<SignUpPageProps, SignUpState> {
  private validationTimeout: number | null = null;

  state: SignUpState = {
    username: "",
    email: "",
    password: "",
    passwordRepeat: "",
    isSubmitting: false,
    successMessage: null,
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
        successMessage: null,
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

          await this.props.apiService.post("/api/1.0/users", body);
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

    return (
      <FormWrapper>
        <Form onSubmit={this.submit}>
          <Title>Sign Up</Title>

          {/* Username Field */}
          <ErrorWrapper>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              onChange={this.handleChange}
              data-testid="username"
            />
            {validationErrors.username && (
              <ErrorMessage data-testid="username-error">
                {errorMessages[validationErrors.username]}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Email Field */}
          <ErrorWrapper>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              onChange={this.handleChange}
              data-testid="email"
            />
            {validationErrors.email && (
              <ErrorMessage data-testid="email-error">
                {errorMessages[validationErrors.email]}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Password Field */}
          <ErrorWrapper>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              onChange={this.handleChange}
              data-testid="password"
            />
            {validationErrors.password && (
              <ErrorMessage data-testid="password-error">
                {errorMessages[validationErrors.password]}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          {/* Password Repeat Field */}
          <ErrorWrapper>
            <Label htmlFor="passwordRepeat">Password Repeat</Label>
            <Input
              id="passwordRepeat"
              type="password"
              onChange={this.handleChange}
              data-testid="passwordRepeat"
            />
            {validationErrors.passwordRepeat && (
              <ErrorMessage data-testid="passwordRepeat-error">
                {errorMessages[validationErrors.passwordRepeat]}
              </ErrorMessage>
            )}
          </ErrorWrapper>

          <Button disabled={this.isDisabled()}>Sign Up</Button>

          {successMessage && (
            <SuccessMessage data-testid="success-message">
              <p>User created successfully!</p>
              <p>Check your email for verification.</p>
            </SuccessMessage>
          )}
        </Form>
      </FormWrapper>
    );
  }
}

export default SignUpPage;
