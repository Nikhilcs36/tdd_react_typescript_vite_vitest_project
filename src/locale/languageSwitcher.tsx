import { useTranslation } from "react-i18next";
import tw from "twin.macro";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div css={tw`fixed z-50 flex gap-2 top-4 right-4`}>
      <button
        onClick={() => i18n.changeLanguage("en")}
        css={tw`px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded hover:bg-blue-200`}
      >
        English
      </button>
      <button
        onClick={() => i18n.changeLanguage("ml")}
        css={tw`px-3 py-1 text-sm text-green-800 bg-green-100 rounded hover:bg-green-200`}
      >
        മലയാളം
      </button>
      <button
        onClick={() => i18n.changeLanguage("ar")}
        css={tw`px-3 py-1 text-sm text-orange-800 bg-orange-100 rounded hover:bg-orange-200`}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;
