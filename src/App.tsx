import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPageWrapper from "./page/UserPage";
import AccountActivationPage from "./page/accountActivationPage";
import {
  axiosApiServiceActivation,
  axiosApiServiceGetUser,
  axiosApiServiceLogin,
  axiosApiServiceSignUp,
  axiosApiServiceUpdateUser
} from "./services/apiService";
import tw from "twin.macro";
import { Provider, useSelector } from "react-redux";
import store, { RootState } from "./store";
import { logout } from "./store/authSlice";

// Navbar styled components
const NavBar = tw.nav`
  bg-gray-400
  text-white
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

const NavLeft = tw.div`flex items-center`;
const NavRight = tw.div`flex items-center gap-6`;
const NavLink = tw(Link)`
  font-semibold
  cursor-pointer
  hover:underline
  transition-all
  duration-200
`;

const Content = tw.div`
  mt-16
`;

// Router-less version for testing
export const AppContent = () => {
  const { t } = useTranslation();
  // Use useSelector to get authentication state and user from Redux store
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user); // Get the user object

  return (
    <I18nextProvider i18n={i18n}>
      <NavBar data-testid="navbar">
        <NavLeft>
          <NavLink to="/" title="Home">
            {t("home")}
          </NavLink>
        </NavLeft>
        <NavRight>
          {/* Use isAuthenticated from Redux */}
          {isAuthenticated ? (
            <>
              <NavLink to={`/user/${user?.id}`} data-testid="my-profile-link">
                {t("myProfile")}
              </NavLink>
              <NavLink
                to="/"
                data-testid="logout-link"
                onClick={(e) => {
                  e.preventDefault();
                  // Dispatch logout action
                  store.dispatch(logout());
                }}
              >
                {t("logout")}
              </NavLink>
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
            element={<UserPageWrapper 
              ApiGetService={axiosApiServiceGetUser} 
              ApiPutService={axiosApiServiceUpdateUser}
            />}
          />
          <Route
            path="/activate/:token"
            element={
              <AccountActivationPage apiService={axiosApiServiceActivation} />
            }
          />
        </Routes>
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
