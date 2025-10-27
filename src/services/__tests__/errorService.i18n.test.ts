import { describe, it, expect, beforeEach } from "vitest";
import i18n from "../../locale/i18n";
import { getUserFriendlyErrorMessage } from "../errorService";
import { act } from "@testing-library/react";

// Helper function to change language
const changeLanguage = async (lang: string) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
};

describe("getUserFriendlyErrorMessage - i18n", () => {
  beforeEach(async () => {
    // Reset to English before each test
    await changeLanguage("en");
  });

  // Test cases for different languages
  const languages = [
    {
      lang: "en",
      translations: {
        "errors.401.token_invalid_or_expired":
          "Your session has expired. Please log in again.",
        "errors.403.permission_denied":
          "You don't have permission to perform this action.",
        "errors.500.internal_server_error":
          "Something went wrong on our end. Please try again later.",
        "errors.network.network_error":
          "Network connection failed. Please check your internet connection.",
      },
    },
    {
      lang: "ml",
      translations: {
        "errors.401.token_invalid_or_expired":
          "നിങ്ങളുടെ സെഷൻ കാലഹരണപ്പെട്ടിരിക്കുന്നു. ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.",
        "errors.403.permission_denied":
          "ഈ പ്രവർത്തനം നടത്താൻ നിങ്ങൾക്ക് അനുമതി ഇല്ല.",
        "errors.500.internal_server_error":
          "ഞങ്ങളുടെ ഭാഗത്ത് എന്തോ പിശക് സംഭവിച്ചു. ദയവായി പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
        "errors.network.network_error":
          "നെറ്റ്‌വർക്ക് കണക്ഷൻ പരാജയപ്പെട്ടു. ദയവായി നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.",
      },
    },
    {
      lang: "ar",
      translations: {
        "errors.401.token_invalid_or_expired":
          "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
        "errors.403.permission_denied":
          "ليس لديك إذن لأداء هذا الإجراء.",
        "errors.500.internal_server_error":
          "حدث خطأ من جانبنا. يرجى المحاولة مرة أخرى لاحقًا.",
        "errors.network.network_error":
          "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.",
      },
    },
  ];

  // Dynamically create tests for each language
  languages.forEach(({ lang, translations }) => {
    describe(`Language: ${lang}`, () => {
      beforeEach(async () => {
        await changeLanguage(lang);
      });

      if (lang === 'ar') {
        it('should have RTL direction for Arabic', () => {
          expect(document.documentElement.dir).toBe('rtl');
        });
      }

      it("should return translated message for 401 error", () => {
        const error = { response: { status: 401 } };
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toBe(translations["errors.401.token_invalid_or_expired"]);
      });

      it("should return translated message for 403 error", () => {
        const error = { response: { status: 403 } };
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toBe(translations["errors.403.permission_denied"]);
      });

      it("should return translated message for 500 error", () => {
        const error = { response: { status: 500 } };
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toBe(translations["errors.500.internal_server_error"]);
      });

      it("should return translated message for network error", () => {
        const error = {}; // No response object for network errors
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toBe(translations["errors.network.network_error"]);
      });

      it("should return translated message for Django validation error", () => {
        const error = {
          response: {
            status: 400,
            data: {
              username: ["Username already exists"],
            },
          },
        };
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toBe(i18n.t("signup.errors.Username already exists"));
      });

      it("should return translated message for Django validation error with email", () => {
        const error = {
          response: {
            status: 400,
            data: {
              email: ["E-mail in use"],
            },
          },
        };
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toBe(i18n.t("signup.errors.E-mail in use"));
      });
    });
  });
});
