import React from "react";
import tw from "twin.macro";

type SpinnerSize = "sm" | "md" | "lg" | number;

const sizeMap: Record<Exclude<SpinnerSize, number>, string> = {
  sm: "w-6 h-6 border-4",
  md: "w-8 h-8 border-4",
  lg: "w-12 h-12 border-4",
};

const SpinnerBase = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;

/**
 * Spinner - a styled spinner component. Keeps a styled-component in the DOM
 * so style-rule based tests (jest-styled-components) continue to work.
 * Props:
 *  - size: "sm" | "md" | "lg" | number (pixels)
 *  - centered: boolean - when true, the spinner is wrapped in a centered container
 *  - className and other div props are forwarded to the inner styled spinner
 */
export const Spinner: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { size?: SpinnerSize; centered?: boolean }
> = ({ size = "sm", centered = false, className = "", ...rest }) => {
  const sizeClasses =
    typeof size === "number" ? `w-[${size}px] h-[${size}px] border-4` : sizeMap[size] ?? sizeMap.sm;

  const spinner = <SpinnerBase className={`${sizeClasses} ${className}`} {...rest} />;

  if (centered) {
    return <div className="flex items-center justify-center">{spinner}</div>;
  }

  return spinner;
};

export default Spinner;