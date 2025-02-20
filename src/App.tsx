import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPage from "./page/UserPage";
import { axiosApiService } from "./services/apiService";
import { useState } from "react";
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

const NavLink = tw.a`
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
  const [path, setPath] = useState(window.location.pathname);

  const onclickLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const newPath = event.currentTarget.getAttribute("href");
    if (newPath) {
      window.history.pushState({}, "", newPath);
      setPath(newPath);
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      <NavBar>
        <NavLeft>
          <NavLink href="/" title="Home" onClick={onclickLink}>
            Home
          </NavLink>
        </NavLeft>
        <NavRight>
          <NavLink href="/signup" onClick={onclickLink}>
            {t("signup.title")}
          </NavLink>
          <NavLink href="/login" onClick={onclickLink}>
            Login
          </NavLink>
        </NavRight>
      </NavBar>

      <Content>
        {path === "/" && <HomePage />}
        {path === "/signup" && <SignUpPage apiService={axiosApiService} />}
        {path === "/login" && <LoginPage />}
        {path.startsWith("/user/") && <UserPage />}
      </Content>
      <LanguageSwitcher />
    </I18nextProvider>
  );
}

export default App;
