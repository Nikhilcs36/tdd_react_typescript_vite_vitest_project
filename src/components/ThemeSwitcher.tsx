import React from "react";
import { useTranslation } from "react-i18next";
import {
  SwitcherContainer,
  IconContainer,
  SunIcon,
  MoonIcon
} from "./ThemeSwitcher.styles";

interface ThemeSwitcherProps {
  onClick: () => void;
  theme: "light" | "dark";
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  onClick,
  theme,
}) => {
  const { i18n } = useTranslation();
  const dir = i18n.dir();
  const isRTL = dir === "rtl";
  const isLight = theme === "light";

  return (
    <SwitcherContainer
      onClick={onClick}
      data-testid="theme-switcher"
      $isLight={isLight}
    >
      <IconContainer $isLight={isLight} $isRTL={isRTL}>
        {isLight ? (
          <SunIcon
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m8.66-12.66l-.7.7M4.04 19.96l-.7.7M21 12h-1M4 12H3m16.66 7.34l-.7-.7M4.04 4.04l-.7-.7"
            />
          </SunIcon>
        ) : (
          <MoonIcon
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </MoonIcon>
        )}
      </IconContainer>
    </SwitcherContainer>
  );
};
