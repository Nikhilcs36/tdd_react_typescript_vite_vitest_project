import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPage from "./page/UserPage";
import AccountActivationPage from "./page/accountActivationPage";
import { axiosApiService } from "./services/apiService";
import tw from "twin.macro";

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

// This container adds a top margin so that the content doesn't hide under the fixed navbar.
const Content = tw.div`
  mt-16
`;

function App() {
  const { t } = useTranslation();
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <NavBar>
          <NavLeft>
            <NavLink to="/" title="Home">
              Home
            </NavLink>
          </NavLeft>
          <NavRight>
            <NavLink to="/signup">{t("signup.title")}</NavLink>
            <NavLink to="/login">Login</NavLink>
          </NavRight>
        </NavBar>
        <Content>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/signup"
              element={<SignUpPage apiService={axiosApiService} />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/user/:id" element={<UserPage />} />
            <Route path="/activate/:token" element={<AccountActivationPage />} />
          </Routes>
        </Content>
      </Router>
      <LanguageSwitcher />
    </I18nextProvider>
  );
}

export default App;
