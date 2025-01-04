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

  onChangeUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ username: event.target.value });
  };

  onChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: event.target.value });
  };

  onChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: event.target.value });
  };

  onChangePasswordRepeat = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ passwordRepeat: event.target.value });
  };

  isDisabled = () => {
    const { password, passwordRepeat } = this.state;
    return !(password && passwordRepeat && password === passwordRepeat);
  };

  submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { username, email, password, passwordRepeat } = this.state;
    const body = { username, email, password, passwordRepeat };
    axios.post("/api/1.0/users", body);
  };

  render() {
    return (
      <div>
        <form onSubmit={this.submit}>
          <h1>Sign Up</h1>
          <label htmlFor="username">Username</label>
          <input id="username" onChange={this.onChangeUsername} />
          <label htmlFor="email">E-mail</label>
          <input id="email" onChange={this.onChangeEmail} />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            onChange={this.onChangePassword}
          />
          <label htmlFor="passwordRepeat">Password Repeat</label>
          <input
            id="passwordRepeat"
            type="password"
            onChange={this.onChangePasswordRepeat}
          />
          <button disabled={this.isDisabled()}>Sign Up</button>
        </form>
      </div>
    );
  }
}

export default SignUpPage;