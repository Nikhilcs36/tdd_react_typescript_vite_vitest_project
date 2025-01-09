import axios from "axios";
import { Component } from "react";

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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
          onSubmit={this.submit}
        >
          <h2 className="mb-4 text-2xl font-bold">Sign Up</h2>
          <div className="mb-4">
            <label
              className="block mb-2 font-medium text-gray-700"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              id="username"
              onChange={this.handleChange}
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2 font-medium text-gray-700"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              id="email"
              onChange={this.handleChange}
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2 font-medium text-gray-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              id="password"
              type="password"
              onChange={this.handleChange}
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2 font-medium text-gray-700"
              htmlFor="passwordRepeat"
            >
              Password Repeat
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              id="passwordRepeat"
              type="password"
              onChange={this.handleChange}
            />
          </div>
          <button
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            disabled={this.isDisabled()}
          >
            Sign Up
          </button>
        </form>
      </div>
    );
  }
}

export default SignUpPage;
