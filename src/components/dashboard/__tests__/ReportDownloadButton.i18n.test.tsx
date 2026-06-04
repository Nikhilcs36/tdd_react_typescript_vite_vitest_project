import i18n from '../../../locale/i18n';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ReportDownloadButton i18n Integration', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it.each([
    {
      lang: 'en',
      expectedButton: 'Download Report',
      expectedDownloading: 'Downloading...',
      expectedConfirmTitle: 'Download Report',
      expectedConfirmSummary: 'Report Summary',
      expectedMode: 'Mode',
      expectedIndividual: 'Individual',
      expectedGrouped: 'Grouped',
      expectedCancel: 'Cancel',
      expectedDownload: 'Download Excel',
      expectedFileError: 'Failed to download report. Please try again.',
    },
    {
      lang: 'ml',
      expectedButton: 'റിപ്പോർട്ട് ഡൗൺലോഡ്',
      expectedDownloading: 'ഡൗൺലോഡ് ചെയ്യുന്നു...',
      expectedConfirmTitle: 'റിപ്പോർട്ട് ഡൗൺലോഡ്',
      expectedConfirmSummary: 'റിപ്പോർട്ട് സംഗ്രഹം',
      expectedMode: 'മോഡ്',
      expectedIndividual: 'വ്യക്തിഗതം',
      expectedGrouped: 'ഗ്രൂപ്പ്',
      expectedCancel: 'റദ്ദാക്കുക',
      expectedDownload: 'Excel ഡൗൺലോഡ്',
      expectedFileError: 'റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
    },
    {
      lang: 'ar',
      expectedButton: 'تحميل التقرير',
      expectedDownloading: 'جاري التحميل...',
      expectedConfirmTitle: 'تحميل التقرير',
      expectedConfirmSummary: 'ملخص التقرير',
      expectedMode: 'الوضع',
      expectedIndividual: 'فردي',
      expectedGrouped: 'مجموعة',
      expectedCancel: 'إلغاء',
      expectedDownload: 'تحميل Excel',
      expectedFileError: 'فشل تحميل التقرير. يرجى المحاولة مرة أخرى.',
    },
  ])(
    'displays report download translations correctly in $lang',
    async ({
      lang,
      expectedButton,
      expectedDownloading,
      expectedConfirmTitle,
      expectedConfirmSummary,
      expectedMode,
      expectedIndividual,
      expectedGrouped,
      expectedCancel,
      expectedDownload,
      expectedFileError,
    }) => {
      await i18n.changeLanguage(lang);

      expect(i18n.t('dashboard.report_download.button')).toBe(expectedButton);
      expect(i18n.t('dashboard.report_download.downloading')).toBe(expectedDownloading);
      expect(i18n.t('dashboard.report_download.confirm_title')).toBe(expectedConfirmTitle);
      expect(i18n.t('dashboard.report_download.confirm_summary')).toBe(expectedConfirmSummary);
      expect(i18n.t('dashboard.report_download.mode_label')).toBe(expectedMode);
      expect(i18n.t('dashboard.report_download.individual')).toBe(expectedIndividual);
      expect(i18n.t('dashboard.report_download.grouped')).toBe(expectedGrouped);
      expect(i18n.t('dashboard.report_download.cancel')).toBe(expectedCancel);
      expect(i18n.t('dashboard.report_download.download')).toBe(expectedDownload);
      expect(i18n.t('dashboard.report_download.file_error')).toBe(expectedFileError);
    }
  );
});