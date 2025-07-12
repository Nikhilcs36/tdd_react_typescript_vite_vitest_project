import React from "react";
import tw from "twin.macro";

// Define styled components
const SwitcherContainer = tw.div`
  w-12
  h-6
  rounded-full
  p-1
  flex
  items-center
  cursor-pointer
  transition-colors
  duration-300
  relative
`;

const IconContainer = tw.div`
  w-5
  h-5
  rounded-full
  bg-white
  dark:bg-gray-800
  shadow-md
  transform
  transition-transform
  duration-300
  absolute
  flex
  items-center
  justify-center
`;

const SunIcon = tw.svg`
  w-4
  h-4
  text-yellow-500
  transition-opacity
  duration-300
`;

const MoonIcon = tw.svg`
  w-4
  h-4
  text-gray-400
  transition-opacity
  duration-300
`;

interface ThemeSwitcherProps {
  onClick: () => void;
  theme: "light" | "dark";
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  onClick,
  theme,
}) => {
  return (
    <SwitcherContainer
      onClick={onClick}
      data-testid="theme-switcher"
      className={theme === "light" ? "bg-blue-400" : "bg-gray-700"}
    >
      <IconContainer
        style={{
          transform:
            theme === "light" ? "translateX(0)" : "translateX(calc(100% + 4px))",
        }}
      >
        {theme === "light" ? (
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
