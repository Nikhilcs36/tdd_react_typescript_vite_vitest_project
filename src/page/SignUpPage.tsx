import axios from "axios";
import { Component } from "react";
import tw from "twin.macro";

const FormWrapper = tw.div`min-h-screen flex items-center justify-center bg-gray-100`;
const Form = tw.form`bg-white p-6 rounded-lg shadow-md w-full max-w-md`;
const Title = tw.h2`text-2xl font-bold mb-4`;
const Label = tw.label`block text-gray-700 font-medium mb-2`;
const Input = tw.input`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`;
const Button = tw.button`py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600`;

interface SignUpState {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
}

class SignUpPage extends Component<{}, SignUpState> {
  state: SignUpState = {
    username: "",
    email: "",
    password: "",
    passwordRepeat: "",
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    this.setState({ [id]: value } as Pick<SignUpState, keyof SignUpState>);
  };

  isDisabled = () => {
    const { password, passwordRepeat } = this.state;
    return !(password && passwordRepeat && password === passwordRepeat);
  };

  submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { username, email, password, passwordRepeat } = this.state;
    const body = { username, email, password, passwordRepeat };
    try {
      const response = await axios.post("/api/1.0/users", body);
      console.log(response.data); // Log success response
    } catch (error: any) {
      console.error(error.response?.data || error.message); // Log error response
    }
  };

  render() {
    return (
      <FormWrapper>
        <Form onSubmit={this.submit}>
          <Title>Sign Up</Title>
          <div className="mb-4">
            <Label htmlFor="username">Username</Label>
            <Input id="username" onChange={this.handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" onChange={this.handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" onChange={this.handleChange} />
          </div>
          <div className="mb-4">
            <Label htmlFor="passwordRepeat">Password Repeat</Label>
            <Input
              id="passwordRepeat"
              type="password"
              onChange={this.handleChange}
            />
          </div>
          <Button disabled={this.isDisabled()}>Sign Up</Button>
        </Form>
      </FormWrapper>
    );
  }
}

export default SignUpPage;
