import { keyframes } from "styled-components";
import styled from "styled-components";

// Fade in animation
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Slide in from below with fade
export const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Page enter animation (fade + slide up)
export const pageEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Fade in component - for language switching
export const FadeIn = styled.div`
  animation: ${fadeIn} 250ms ease-in-out forwards;
`;

// Slide in up component - for subtle content entrance
export const SlideInUp = styled.div`
  animation: ${slideInUp} 300ms ease-out forwards;
`;

// Page transition wrapper - for route changes
export const PageTransitionWrapper = styled.div`
  animation: ${pageEnter} 350ms ease-out forwards;
`;