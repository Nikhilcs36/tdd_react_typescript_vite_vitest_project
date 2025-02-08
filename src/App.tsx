import { I18nextProvider } from "react-i18next";
import i18n from "./locale/i18n";
import LanguageSwitcher from "./locale/languageSwitcher";
import SignUpPage from "./page/SignUpPage";
import { axiosApiService } from "./services/apiService";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
      <SignUpPage apiService={axiosApiService} />
    </I18nextProvider>
  );
}

export default App;
