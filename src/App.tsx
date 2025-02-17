import { I18nextProvider } from "react-i18next";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import { axiosApiService } from "./services/apiService";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPage from "./page/UserPage";
import { useTranslation } from "react-i18next";
import { useState } from "react";

function App() {
  const { t } = useTranslation();

  const [path, setPath] = useState(window.location.pathname);

  const onclickLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // event.currentTarget is the actual <a> element
    const path = event.currentTarget.getAttribute("href");
    if (path) {
      window.history.pushState({}, "", path);
      setPath(path);
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      <div>
        <a href="/" title="Home">
          Home
        </a>
        <a href="/signup" onClick={onclickLink}>
          {t("signup.title")}
        </a>
      </div>
      {path == "/" && <HomePage />}
      {path == "/signup" && (
        <SignUpPage apiService={axiosApiService} />
      )}
      {path == "/login" && <LoginPage />}
      {path.startsWith("/user/") && <UserPage />}
      <LanguageSwitcher />
    </I18nextProvider>
  );
}

export default App;
