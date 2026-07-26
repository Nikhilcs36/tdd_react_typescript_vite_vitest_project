import { ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FadeIn } from "../../styles/animations";

interface LanguageTransitionProps {
  children: ReactNode;
}

export const LanguageTransition = ({ children }: LanguageTransitionProps) => {
  const { i18n } = useTranslation();
  const langKey = i18n.language;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevLangRef = useRef(langKey);

  useEffect(() => {
    if (prevLangRef.current !== langKey) {
      prevLangRef.current = langKey;
      // Re-trigger the CSS animation on the existing DOM element
      // without unmounting/remounting. This preserves scroll position.
      if (wrapperRef.current) {
        const el = wrapperRef.current;
        el.style.animation = "none";
        // Force reflow so the 'none' takes effect before we restore the animation
        void el.offsetHeight;
        el.style.animation = "";
      }
    }
  }, [langKey]);

  return (
    <FadeIn ref={wrapperRef}>
      {children}
    </FadeIn>
  );
};