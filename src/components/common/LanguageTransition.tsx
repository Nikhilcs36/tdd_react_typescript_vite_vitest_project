import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FadeIn } from "../../styles/animations";

interface LanguageTransitionProps {
  children: ReactNode;
}

export const LanguageTransition = ({ children }: LanguageTransitionProps) => {
  const { i18n } = useTranslation();
  const langKey = i18n.language;

  return (
    <FadeIn key={langKey}>
      {children}
    </FadeIn>
  );
};