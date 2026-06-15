import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "../store";

export const LoginCountdownBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();

  if (!isAuthenticated || !user) return null;
  if (dismissed) return null;
  if (user.staff_access_granted || user.logins_remaining_for_staff <= 0) return null;

  return (
    <div
      data-testid="login-countdown-banner"
      className="flex items-center justify-between p-3 mb-4 text-yellow-800 bg-yellow-100 border border-yellow-300 rounded dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300"
    >
      <span data-testid="login-countdown-text">
        {t("staffAccess", { count: user.logins_remaining_for_staff })}
      </span>
      <button
        data-testid="dismiss-banner-button"
        onClick={() => setDismissed(true)}
        className="ml-3 font-bold text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
};

export default LoginCountdownBanner;