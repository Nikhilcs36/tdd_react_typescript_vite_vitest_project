import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPageWrapper from "./page/UserPage";
import ProfilePageWrapper from "./page/ProfilePage";
import AccountActivationPage from "./page/accountActivationPage";
import {
  axiosApiServiceActivation,
  axiosApiServiceGetUser,
  axiosApiServiceGetCurrentUser,
  axiosApiServiceLogin,
  axiosApiServiceSignUp,
  axiosApiServiceUpdateUser,
  axiosApiServiceLogout,
  ApiService,
} from "./services/apiService";
import tw from "twin.macro";
import { Provider, useSelector } from "react-redux";
import store, { RootState } from "./store";
import { useLogout } from "./components/logout/useLogout";
import LogoutMessage from "./components/logout/LogoutMessage";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import ErrorBoundary from "./components/ErrorBoundary";

// Navbar styled components
const NavBar = tw.nav`
  bg-gray-400
  dark:bg-dark-secondary
  text-white
  dark:text-dark-text
  py-4
  px-6
  flex
  items-center
  justify-between
  fixed
  w-full
  top-0
  z-20
  shadow-lg
`;
const NavLeft = tw.div`flex items-center gap-4`;
const NavRight = tw.div`flex items-center gap-6`;
const NavLink = tw(Link)`
  font-semibold
  cursor-pointer
  hover:underline
  transition-all
  duration-200
`;
const StyledButton = tw.button`
  font-semibold
  cursor-pointer
  hover:underline
  transition-all
  duration-200
`;
const Content = tw.div`
  mt-16
  dark:bg-dark-primary
`;

interface AppContentProps {
  logoutApiService?: ApiService;
}

export const AppContent = ({
  logoutApiService = axiosApiServiceLogout,
}: AppContentProps) => {
  const { t } = useTranslation();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const { logout: logoutUser } = useLogout(logoutApiService);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme || "light") as "light" | "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeSwitch = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <I18nextProvider i18n={i18n}>
      <NavBar data-testid="navbar">
        <NavLeft>
          <NavLink to="/" title="Home">
            {t("home")}
          </NavLink>
          <ThemeSwitcher onClick={handleThemeSwitch} theme={theme} />
        </NavLeft>
        <NavRight>
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" data-testid="my-profile-link">
                {t("myProfile")}
              </NavLink>
              <StyledButton onClick={logoutUser} data-testid="logout-link">
                {t("logout.title")}
              </StyledButton>
            </>
          ) : (
            <>
              <NavLink to="/signup" data-testid="signup-link">
                {t("signup.title")}
              </NavLink>
              <NavLink to="/login" data-testid="login-link">
                {t("login.title")}
              </NavLink>
            </>
          )}
        </NavRight>
      </NavBar>
      <Content>
        <ErrorBoundary>
          <LogoutMessage />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/signup"
              element={<SignUpPage apiService={axiosApiServiceSignUp} />}
            />
            <Route
              path="/login"
              element={<LoginPage apiService={axiosApiServiceLogin} />}
            />
            <Route
              path="/user/:id"
              element={
                <UserPageWrapper
                  ApiGetService={axiosApiServiceGetUser}
                  ApiPutService={axiosApiServiceUpdateUser}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ProfilePageWrapper
                  ApiGetService={axiosApiServiceGetCurrentUser}
                  ApiPutService={axiosApiServiceUpdateUser}
                />
              }
            />
            <Route
              path="/activate/:token"
              element={
                <AccountActivationPage apiService={axiosApiServiceActivation} />
              }
            />
          </Routes>
        </ErrorBoundary>
      </Content>
      <LanguageSwitcher />
    </I18nextProvider>
  );
};
// Production version with Router
const AppWithRouter = () => (
  <Router>
    <AppContent />
  </Router>
);
// Wrap the AppWithRouter with the Redux Provider
const App = () => (
  <Provider store={store}>
    <AppWithRouter />
  </Provider>
);

export default App; // Export the new App component
