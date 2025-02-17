import { I18nextProvider } from "react-i18next";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import { axiosApiService } from "./services/apiService";
import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import UserPage from "./page/UserPage";
import { useTranslation } from "react-i18next";

function App() {
  const { t } = useTranslation();
  return (
    <I18nextProvider i18n={i18n}>
      <div>
        <a href="/" title="Home">Home</a>
        <a href="/signup">{t('signup.title')}</a>
      </div>
      {window.location.pathname == '/' && <HomePage />}
      {window.location.pathname == '/signup' && <SignUpPage apiService={axiosApiService} />}
      {window.location.pathname == '/login' && <LoginPage />}
      {window.location.pathname.startsWith('/user/') && <UserPage />}
      <LanguageSwitcher />
    </I18nextProvider>
  );
}

export default App;
