import { describe, it, expect, beforeEach } from "vitest";
import i18n from "./i18n";

describe("Homepage Toggle i18n", () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage("en");
  });

  describe("homepage.toggle.features", () => {
    it.each([
      { lang: "en", expectedMessage: "Features" },
      { lang: "ml", expectedMessage: "സവിശേഷതകൾ" },
      { lang: "ar", expectedMessage: "الميزات" },
    ])("displays Features toggle label correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("homepage.toggle.features")).toBe(expectedMessage);
    });
  });

  describe("homepage.toggle.game", () => {
    it.each([
      { lang: "en", expectedMessage: "Game" },
      { lang: "ml", expectedMessage: "ഗെയിം" },
      { lang: "ar", expectedMessage: "لعبة" },
    ])("displays Game toggle label correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("homepage.toggle.game")).toBe(expectedMessage);
    });
  });
});