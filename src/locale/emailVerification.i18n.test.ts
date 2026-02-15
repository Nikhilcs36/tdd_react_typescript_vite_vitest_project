import { describe, it, expect, beforeEach } from "vitest";
import i18n from "./i18n";

describe("Email Verification i18n", () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage("en");
  });

  describe("login.errors.email_not_verified", () => {
    it.each([
      {
        lang: "en",
        expectedMessage: "Please verify your email before logging in.",
      },
      {
        lang: "ml",
        expectedMessage: "ലോഗിൻ ചെയ്യുന്നതിന് മുമ്പ് ദയവായി നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുക.",
      },
      {
        lang: "ar",
        expectedMessage: "يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول.",
      },
    ])("displays email_not_verified error correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      const translatedMessage = i18n.t("login.errors.email_not_verified");
      expect(translatedMessage).toBe(expectedMessage);
    });
  });

  describe("Email verification page translations", () => {
    it.each([
      {
        lang: "en",
        expectedTitle: "Email Verification",
        expectedVerifying: "Verifying your email...",
        expectedSuccessTitle: "Email Verified!",
        expectedSuccessMessage: "Your email has been successfully verified.",
        expectedLoginButton: "Go to Login",
        expectedErrorExpired: "Verification link has expired. Please request a new one.",
        expectedErrorInvalid: "Invalid verification token.",
        expectedResendButton: "Resend Verification Email",
      },
      {
        lang: "ml",
        expectedTitle: "ഇമെയിൽ വെരിഫിക്കേഷൻ",
        expectedVerifying: "നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുന്നു...",
        expectedSuccessTitle: "ഇമെയിൽ വെരിഫൈഡ്!",
        expectedSuccessMessage: "നിങ്ങളുടെ ഇമെയിൽ വിജയകരമായി വെരിഫൈ ചെയ്യപ്പെട്ടു.",
        expectedLoginButton: "ലോഗിനിലേക്ക് പോകുക",
        expectedErrorExpired: "വെരിഫിക്കേഷൻ ലിങ്കിന്റെ കാലാവധി കഴിഞ്ഞു. ദയവായി പുതിയത് അഭ്യർത്ഥിക്കുക.",
        expectedErrorInvalid: "അസാധുവായ വെരിഫിക്കേഷൻ ടോക്കൺ.",
        expectedResendButton: "വെരിഫിക്കേഷൻ ഇമെയിൽ വീണ്ടും അയക്കുക",
      },
      {
        lang: "ar",
        expectedTitle: "التحقق من البريد الإلكتروني",
        expectedVerifying: "جاري التحقق من بريدك الإلكتروني...",
        expectedSuccessTitle: "تم التحقق من البريد الإلكتروني!",
        expectedSuccessMessage: "تم التحقق من بريدك الإلكتروني بنجاح.",
        expectedLoginButton: "الذهاب إلى تسجيل الدخول",
        expectedErrorExpired: "انتهت صلاحية رابط التحقق. يرجى طلب رابط جديد.",
        expectedErrorInvalid: "رمز التحقق غير صالح.",
        expectedResendButton: "إعادة إرسال بريد التحقق",
      },
    ])(
      "displays email verification translations correctly in $lang",
      async ({
        lang,
        expectedTitle,
        expectedVerifying,
        expectedSuccessTitle,
        expectedSuccessMessage,
        expectedLoginButton,
        expectedErrorExpired,
        expectedErrorInvalid,
        expectedResendButton,
      }) => {
        await i18n.changeLanguage(lang);

        expect(i18n.t("emailVerification.title")).toBe(expectedTitle);
        expect(i18n.t("emailVerification.verifying")).toBe(expectedVerifying);
        expect(i18n.t("emailVerification.success.title")).toBe(expectedSuccessTitle);
        expect(i18n.t("emailVerification.success.message")).toBe(expectedSuccessMessage);
        expect(i18n.t("emailVerification.success.loginButton")).toBe(expectedLoginButton);
        expect(i18n.t("emailVerification.errors.expired")).toBe(expectedErrorExpired);
        expect(i18n.t("emailVerification.errors.invalid")).toBe(expectedErrorInvalid);
        expect(i18n.t("emailVerification.resend.button")).toBe(expectedResendButton);
      }
    );
  });
});
