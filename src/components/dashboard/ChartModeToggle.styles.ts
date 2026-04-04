import tw, { styled } from "twin.macro";

export const ToggleContainer = tw.div`flex items-center justify-between mb-4`;
export const ToggleButtonsContainer = tw.div`flex items-center space-x-2`;
export const ModeLabel = tw.span`text-sm font-medium text-gray-700 dark:text-gray-300`;
export const DateRangeLabel = tw.span`text-sm text-gray-500 dark:text-gray-400 ml-8`;
export const PlaceholderContainer = tw.div`flex items-center justify-end h-12`;

export const ToggleButton = styled.button<{ $isActive?: boolean; $disabled?: boolean }>`
  ${tw`px-4 py-2 font-medium transition-all duration-200 rounded-lg`}
  ${({ $disabled }) => $disabled && tw`opacity-50 cursor-not-allowed`}
  ${({ $disabled, $isActive }) => !$disabled && $isActive && tw`text-white bg-blue-600 shadow-md`}
  ${({ $disabled, $isActive }) => !$disabled && !$isActive && tw`text-gray-700 bg-gray-200 dark:bg-dark-accent dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-secondary`}
`;