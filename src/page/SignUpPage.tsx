import { Component} from "react";

interface SignUpState {
  password: string;
  passwordRepeat: string;
}

class SignUpPage extends Component<{}, SignUpState> {
  state: SignUpState = {
    password: "",
    passwordRepeat: "",
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

  render() {
    return (
      <div>
        <h1>Sign Up</h1>
        <label htmlFor="username">Username</label>
        <input id="username" />
        <label htmlFor="email">E-mail</label>
        <input id="email" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" onChange={this.onChangePassword} />
        <label htmlFor="passwordRepeat">Password Repeat</label>
        <input id="passwordRepeat" type="password" onChange={this.onChangePasswordRepeat} />
        <button disabled={this.isDisabled()}>Sign Up</button>
      </div>
    );
  }
}

export default SignUpPage;