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
      <div>
        <form onSubmit={this.submit}>
          <h1>Sign Up</h1>
          <label htmlFor="username">Username</label>
          <input id="username" onChange={this.handleChange} />
          <label htmlFor="email">E-mail</label>
          <input id="email" onChange={this.handleChange} />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" onChange={this.handleChange} />
          <label htmlFor="passwordRepeat">Password Repeat</label>
          <input
            id="passwordRepeat"
            type="password"
            onChange={this.handleChange}
          />
          <button disabled={this.isDisabled()}>Sign Up</button>
        </form>
      </div>
    );
  }
}

export default SignUpPage;
