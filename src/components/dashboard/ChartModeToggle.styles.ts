import tw, { styled } from "twin.macro";

export const ToggleContainer = tw.div`flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 sm:gap-0`;
export const ToggleButtonsContainer = tw.div`flex flex-wrap items-center gap-1 sm:gap-2`;
export const ModeLabel = tw.span`text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap`;
export const DateRangeLabel = tw.span`text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:ml-8 text-center sm:text-left`;
export const PlaceholderContainer = tw.div`flex items-center justify-end h-12`;

export const ToggleButton = styled.button<{ $isActive?: boolean; $disabled?: boolean }>`
  ${tw`px-3 py-2 text-xs font-medium transition-all duration-200 rounded-lg sm:px-4 sm:text-sm whitespace-nowrap`}
  ${({ $disabled }) => $disabled && tw`opacity-50 cursor-not-allowed`}
  ${({ $disabled, $isActive }) => !$disabled && $isActive && tw`text-white bg-blue-600 shadow-md`}
  ${({ $disabled, $isActive }) => !$disabled && !$isActive && tw`text-gray-700 bg-gray-200 dark:bg-dark-accent dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-secondary`}
`;
