import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PageTransitionWrapper } from "../../styles/animations";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const routeKey = location.pathname + location.search;

  return (
    <PageTransitionWrapper key={routeKey}>
      {children}
    </PageTransitionWrapper>
  );
};