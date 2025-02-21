import { describe, expect, it } from "vitest";
import i18n from "./i18n";
import { act } from "@testing-library/react";

describe("i18n languageChanged event updates document html attributes", () => {
  it.each([
    { lang: "en", expectedDir: "ltr" },
    { lang: "ml", expectedDir: "ltr" },
    { lang: "ar", expectedDir: "rtl" },
  ])(
    "should update document attributes when language is changed to $lang",
    async ({ lang, expectedDir }) => {
      // Change the language inside an act() block to ensure all state updates are flushed.
      await act(async () => {
        await i18n.changeLanguage(lang);
      });

      expect(document.documentElement.lang).toBe(lang);
      expect(document.documentElement.dir).toBe(expectedDir);
    }
  );
});
