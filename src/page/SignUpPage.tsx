import { Component } from "react";
import tw, { styled } from "twin.macro";
import { ApiService } from "../services/apiService";

const FormWrapper = tw.div`min-h-screen flex items-center justify-center bg-gray-100`;
const Form = tw.form`bg-white p-6 rounded-lg shadow-md w-full max-w-md`;
const Title = tw.h2`text-2xl font-bold mb-4`;
const Label = tw.label`block text-gray-700 font-medium mb-2`;
const Input = tw.input`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`;
const Button = styled.button<{ disabled?: boolean }>(({ disabled }) => [
  tw`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600`,
  disabled && tw`bg-gray-400 cursor-not-allowed hover:bg-gray-400`,
]);
const SuccessMessage = tw.div`mt-4 p-4 text-green-700 bg-green-100 rounded [text-align: center]`;
const ErrorMessage = tw.div`mt-2 text-red-700`;

interface SignUpState {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
  isSubmitting: boolean;
  successMessage: string | boolean | null;
  validationErrors: Record<string, string>;
}

interface SignUpPageProps {
  apiService: ApiService;
}

const errorMessages: Record<string, string> = {
  password_mismatch: "Passwords do not match",
  password_null: "Password cannot be null",
};

class SignUpPage extends Component<SignUpPageProps, SignUpState> {
  state: SignUpState = {
    username: "",
    email: "",
    password: "",
    passwordRepeat: "",
    isSubmitting: false,
    successMessage: null,
    validationErrors: {},
  };

  // handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const { id, value } = event.target;

  //   // Ensure the ID is a key of SignUpState before updating
  //   if (id in this.state) {
  //     this.setState((prevState) => ({
  //       ...prevState, // Keep existing state properties
  //       [id]: value, // Update the changed field
  //     }));
  //   }
  // };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    this.setState({ [id]: value, validationErrors: {} } as Pick<
      SignUpState,
      keyof SignUpState
    >);
  };

  isDisabled = () => {
    const { password, passwordRepeat, isSubmitting } = this.state;
    return (
      !(password && passwordRepeat && password === passwordRepeat) ||
      isSubmitting === true
    );
  };

  submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { username, email, password, passwordRepeat } = this.state;
    const body = { username, email, password, passwordRepeat };
    //this.setState({ isSubmitting: true });
    this.setState({
      isSubmitting: true,
      successMessage: null,
      validationErrors: {},
    });
    try {
      const response = await this.props.apiService.post("/api/1.0/users", body);
      console.log(response.data); // Log success response
      this.setState({ successMessage: true });
    } catch (error: any) {
      console.error("Error details:", {
        responseData: error.response?.data,
        message: error.message, //Axios or fetch
      });

      const validationErrors =
        error.response?.data?.validationErrors || error.validationErrors || {};
      this.setState({ validationErrors, isSubmitting: false });
    }
  };

  render() {
    const { successMessage, validationErrors } = this.state;
    return (
      <FormWrapper>
        <Form onSubmit={this.submit}>
          <Title>Sign Up</Title>
          <div className="mb-4">
            <Label htmlFor="username">Username</Label>
            <Input id="username" onChange={this.handleChange} />
            {validationErrors.username && (
              <ErrorMessage data-testid="username-error">
                {errorMessages[validationErrors.username] ||
                  validationErrors.username}
              </ErrorMessage>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" onChange={this.handleChange} />
            {validationErrors.email && (
              <ErrorMessage data-testid="email-error">
                {errorMessages[validationErrors.email] ||
                  validationErrors.email}
              </ErrorMessage>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" onChange={this.handleChange} />
            {validationErrors.password && (
              <ErrorMessage data-testid="password-error">
                {errorMessages[validationErrors.password] ||
                  validationErrors.password}
              </ErrorMessage>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="passwordRepeat">Password Repeat</Label>
            <Input
              id="passwordRepeat"
              type="password"
              onChange={this.handleChange}
            />
            {validationErrors.passwordRepeat && (
              <ErrorMessage data-testid="passwordRepeat-error">
                {errorMessages[validationErrors.passwordRepeat] ||
                  validationErrors.passwordRepeat}
              </ErrorMessage>
            )}
          </div>
          <Button disabled={this.isDisabled()}>Sign Up</Button>
          {/* Success Message */}
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
