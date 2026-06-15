import { describe, it, expect } from "vitest";
import i18n from "../locale/i18n";

describe("LoginCountdownBanner i18n", () => {
  describe("staffAccess translation", () => {
    it.each([
      {
        lang: "en",
        count: 2,
        expectedMessage: "🎉 2 more login(s) to unlock staff access!",
      },
      {
        lang: "ml",
        count: 2,
        expectedMessage: "🎉 2 കൂടുതൽ ലോഗിൻ(s) സ്റ്റാഫ് ആക്സസ് അൺലോക്ക് ചെയ്യാൻ!",
      },
      {
        lang: "ar",
        count: 2,
        expectedMessage: "🎉 2 تسجيل دخول إضافي(p) لفتح وصول الموظفين!",
      },
    ])(
      "displays staffAccess message correctly in $lang with count=$count",
      async ({ lang, count, expectedMessage }) => {
        await i18n.changeLanguage(lang);
        const translatedMessage = i18n.t("staffAccess", { count });
        expect(translatedMessage).toBe(expectedMessage);
      }
    );
  });
});