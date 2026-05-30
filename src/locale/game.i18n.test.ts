import { describe, it, expect, beforeEach } from "vitest";
import i18n from "./i18n";

describe("Game i18n", () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage("en");
  });

  describe("homepage.features.game", () => {
    it.each([
      {
        lang: "en",
        expectedMessage: "🎮 Entertainment Zone",
      },
      {
        lang: "ml",
        expectedMessage: "🎮 വിനോദ സോൺ",
      },
      {
        lang: "ar",
        expectedMessage: "🎮 منطقة الترفيه",
      },
    ])("displays game feature correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("homepage.features.game")).toBe(expectedMessage);
    });
  });

  describe("homepage.features.gameDesc", () => {
    it.each([
      {
        lang: "en",
        expectedMessage: "Need a fun break? Draw circles, beat your score — a playful escape from analytics.",
      },
      {
        lang: "ml",
        expectedMessage: "ഒരു രസകരമായ ഇടവേള വേണോ? വൃത്തങ്ങൾ വരയ്ക്കുക, നിങ്ങളുടെ സ്കോർ മറികടക്കുക — അനലിറ്റിക്സിൽ നിന്നുള്ള ഒരു കളിയായ രക്ഷപ്പെടൽ.",
      },
      {
        lang: "ar",
        expectedMessage: "هل تحتاج إلى استراحة ممتعة؟ ارسم دوائر، تغلب على درجتك — هروب مرح من التحليلات.",
      },
    ])("displays game description correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("homepage.features.gameDesc")).toBe(expectedMessage);
    });
  });

  describe("gameSection", () => {
    it.each([
      {
        lang: "en",
        expectedTitle: "Take a Mental Break 🎯",
        expectedSubtitle: "Unlock entertainment, free your mind instead of digital analysis",
        expectedPlayButton: "🎯 Play Now",
        expectedHideButton: "Hide Game",
      },
      {
        lang: "ml",
        expectedTitle: "ഒരു മാനസിക ഇടവേള എടുക്കുക 🎯",
        expectedSubtitle: "വിനോദം അൺലോക്ക് ചെയ്യുക, ഡിജിറ്റൽ വിശകലനത്തിന് പകരം നിങ്ങളുടെ മനസ്സിനെ സ്വതന്ത്രമാക്കുക",
        expectedPlayButton: "🎯 ഇപ്പോൾ കളിക്കുക",
        expectedHideButton: "ഗെയിം മറയ്ക്കുക",
      },
      {
        lang: "ar",
        expectedTitle: "خذ استراحة ذهنية 🎯",
        expectedSubtitle: "افتح الترفيه، حرر عقلك بدلاً من التحليل الرقمي",
        expectedPlayButton: "🎯 العب الآن",
        expectedHideButton: "إخفاء اللعبة",
      },
    ])("displays game section translations correctly in $lang", async ({
      lang,
      expectedTitle,
      expectedSubtitle,
      expectedPlayButton,
      expectedHideButton,
    }) => {
      await i18n.changeLanguage(lang);

      expect(i18n.t("homepage.gameSection.title")).toBe(expectedTitle);
      expect(i18n.t("homepage.gameSection.subtitle")).toBe(expectedSubtitle);
      expect(i18n.t("homepage.gameSection.playButton")).toBe(expectedPlayButton);
      expect(i18n.t("homepage.gameSection.hideButton")).toBe(expectedHideButton);
    });
  });

  describe("game.title", () => {
    it.each([
      { lang: "en", expectedMessage: "Draw a Circle" },
      { lang: "ml", expectedMessage: "ഒരു വൃത്തം വരയ്ക്കുക" },
      { lang: "ar", expectedMessage: "ارسم دائرة" },
    ])("displays game title correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.title")).toBe(expectedMessage);
    });
  });

  describe("game.instruction", () => {
    it.each([
      { lang: "en", expectedMessage: "Draw a perfect circle on the canvas. Release to see your score!" },
      { lang: "ml", expectedMessage: "കാൻവാസിൽ ഒരു സമ്പൂർണ്ണ വൃത്തം വരയ്ക്കുക. സ്കോർ കാണുന്നതിന് റിലീസ് ചെയ്യുക!" },
      { lang: "ar", expectedMessage: "ارسم دائرة مثالية على اللوحة. اتركها لترى درجتك!" },
    ])("displays game instruction correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.instruction")).toBe(expectedMessage);
    });
  });

  describe("game.submit", () => {
    it.each([
      { lang: "en", expectedMessage: "Submit Score" },
      { lang: "ml", expectedMessage: "സ്കോർ സമർപ്പിക്കുക" },
      { lang: "ar", expectedMessage: "إرسال الدرجة" },
    ])("displays submit score correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.submit")).toBe(expectedMessage);
    });
  });

  describe("game.clear", () => {
    it.each([
      { lang: "en", expectedMessage: "Clear" },
      { lang: "ml", expectedMessage: "മായ്ക്കുക" },
      { lang: "ar", expectedMessage: "مسح" },
    ])("displays clear correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.clear")).toBe(expectedMessage);
    });
  });

  describe("game.drawAgain", () => {
    it.each([
      { lang: "en", expectedMessage: "Draw Again" },
      { lang: "ml", expectedMessage: "വീണ്ടും വരയ്ക്കുക" },
      { lang: "ar", expectedMessage: "ارسم مرة أخرى" },
    ])("displays draw again correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.drawAgain")).toBe(expectedMessage);
    });
  });

  describe("game.score", () => {
    it.each([
      { lang: "en", expectedMessage: "Accuracy: {{score}}%" },
      { lang: "ml", expectedMessage: "കൃത്യത: {{score}}%" },
      { lang: "ar", expectedMessage: "الدقة: {{score}}%" },
    ])("displays score correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.score")).toBe(expectedMessage);
    });
  });

  describe("game.bestScore", () => {
    it.each([
      { lang: "en", expectedMessage: "Best Score: {{score}}%" },
      { lang: "ml", expectedMessage: "മികച്ച സ്കോർ: {{score}}%" },
      { lang: "ar", expectedMessage: "أفضل درجة: {{score}}%" },
    ])("displays best score correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.bestScore")).toBe(expectedMessage);
    });
  });

  describe("game.noBestScore", () => {
    it.each([
      { lang: "en", expectedMessage: "No best score yet" },
      { lang: "ml", expectedMessage: "ഇതുവരെ മികച്ച സ്കോർ ഇല്ല" },
      { lang: "ar", expectedMessage: "لا توجد أفضل درجة بعد" },
    ])("displays no best score correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.noBestScore")).toBe(expectedMessage);
    });
  });

  describe("game.loading", () => {
    it.each([
      { lang: "en", expectedMessage: "Scoring..." },
      { lang: "ml", expectedMessage: "സ്കോർ ചെയ്യുന്നു..." },
      { lang: "ar", expectedMessage: "جاري التقييم..." },
    ])("displays loading correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.loading")).toBe(expectedMessage);
    });
  });

  describe("game.error", () => {
    it.each([
      { lang: "en", expectedMessage: "Failed to save score. Please try again." },
      { lang: "ml", expectedMessage: "സ്കോർ സംരക്ഷിക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക." },
      { lang: "ar", expectedMessage: "فشل في حفظ الدرجة. يرجى المحاولة مرة أخرى." },
    ])("displays error correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.error")).toBe(expectedMessage);
    });
  });

  describe("game.disabled", () => {
    it.each([
      { lang: "en", expectedMessage: "Game section is currently disabled." },
      { lang: "ml", expectedMessage: "ഗെയിം വിഭാഗം നിലവിൽ പ്രവർത്തനരഹിതമാണ്." },
      { lang: "ar", expectedMessage: "قسم اللعبة معطل حاليًا." },
    ])("displays disabled correctly in $lang", async ({ lang, expectedMessage }) => {
      await i18n.changeLanguage(lang);
      expect(i18n.t("game.disabled")).toBe(expectedMessage);
    });
  });

  describe("game.rating", () => {
    it.each([
      {
        lang: "en",
        expectedExcellent: "Excellent!",
        expectedGood: "Good!",
        expectedFair: "Fair",
        expectedPoor: "Try Again",
      },
      {
        lang: "ml",
        expectedExcellent: "മികച്ചത്!",
        expectedGood: "നല്ലത്!",
        expectedFair: "മതിയായത്",
        expectedPoor: "വീണ്ടും ശ്രമിക്കുക",
      },
      {
        lang: "ar",
        expectedExcellent: "ممتاز!",
        expectedGood: "جيد!",
        expectedFair: "مقبول",
        expectedPoor: "حاول مرة أخرى",
      },
    ])("displays rating translations correctly in $lang", async ({
      lang,
      expectedExcellent,
      expectedGood,
      expectedFair,
      expectedPoor,
    }) => {
      await i18n.changeLanguage(lang);

      expect(i18n.t("game.rating.excellent")).toBe(expectedExcellent);
      expect(i18n.t("game.rating.good")).toBe(expectedGood);
      expect(i18n.t("game.rating.fair")).toBe(expectedFair);
      expect(i18n.t("game.rating.poor")).toBe(expectedPoor);
    });
  });

  describe("game.leaderboard", () => {
    it.each([
      {
        lang: "en",
        expectedShow: "Show Leaderboard",
        expectedHide: "Hide Leaderboard",
        expectedTitle: "Leaderboard",
        expectedRank: "Rank",
        expectedUsername: "Username",
        expectedScore: "Score",
        expectedLastPlayed: "Last Played",
        expectedEmpty: "No scores yet",
        expectedError: "Failed to load leaderboard",
        expectedLoadMore: "Load More",
        expectedLoading: "Loading...",
      },
      {
        lang: "ml",
        expectedShow: "ലീഡർബോർഡ് കാണിക്കുക",
        expectedHide: "ലീഡർബോർഡ് മറയ്ക്കുക",
        expectedTitle: "ലീഡർബോർഡ്",
        expectedRank: "റാങ്ക്",
        expectedUsername: "ഉപയോക്തൃനാമം",
        expectedScore: "സ്കോർ",
        expectedLastPlayed: "അവസാനം കളിച്ചത്",
        expectedEmpty: "ഇതുവരെ സ്കോറുകളില്ല",
        expectedError: "ലീഡർബോർഡ് ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു",
        expectedLoadMore: "കൂടുതൽ ലോഡ് ചെയ്യുക",
        expectedLoading: "ലോഡ് ചെയ്യുന്നു...",
      },
      {
        lang: "ar",
        expectedShow: "إظهار لوحة المتصدرين",
        expectedHide: "إخفاء لوحة المتصدرين",
        expectedTitle: "لوحة المتصدرين",
        expectedRank: "الترتيب",
        expectedUsername: "اسم المستخدم",
        expectedScore: "الدرجة",
        expectedLastPlayed: "آخر مرة لعب",
        expectedEmpty: "لا توجد درجات بعد",
        expectedError: "فشل في تحميل لوحة المتصدرين",
        expectedLoadMore: "تحميل المزيد",
        expectedLoading: "جاري التحميل...",
      },
    ])("displays leaderboard translations correctly in $lang", async ({
      lang,
      expectedShow,
      expectedHide,
      expectedTitle,
      expectedRank,
      expectedUsername,
      expectedScore,
      expectedLastPlayed,
      expectedEmpty,
      expectedError,
      expectedLoadMore,
      expectedLoading,
    }) => {
      await i18n.changeLanguage(lang);

      expect(i18n.t("game.leaderboard.show")).toBe(expectedShow);
      expect(i18n.t("game.leaderboard.hide")).toBe(expectedHide);
      expect(i18n.t("game.leaderboard.title")).toBe(expectedTitle);
      expect(i18n.t("game.leaderboard.rank")).toBe(expectedRank);
      expect(i18n.t("game.leaderboard.username")).toBe(expectedUsername);
      expect(i18n.t("game.leaderboard.score")).toBe(expectedScore);
      expect(i18n.t("game.leaderboard.lastPlayed")).toBe(expectedLastPlayed);
      expect(i18n.t("game.leaderboard.empty")).toBe(expectedEmpty);
      expect(i18n.t("game.leaderboard.error")).toBe(expectedError);
      expect(i18n.t("game.leaderboard.loadMore")).toBe(expectedLoadMore);
      expect(i18n.t("game.leaderboard.loading")).toBe(expectedLoading);
    });
  });
});