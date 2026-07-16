import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - scrolls the window to the top whenever the route pathname changes.
 * This ensures users see the top of each new page when navigating via the navbar.
 * Renders nothing (returns null).
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};