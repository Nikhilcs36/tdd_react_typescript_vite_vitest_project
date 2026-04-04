import tw, { styled } from "twin.macro";

export const FilterContainer = tw.div`flex gap-2 mb-6`;

export const FilterButton = styled.button<{ isActive?: boolean; disabled?: boolean }>`
  ${tw`px-4 py-2 font-medium transition-all duration-200 rounded-lg`}
  ${({ isActive, disabled }) => [
    disabled && tw`opacity-50 cursor-not-allowed`,
    !disabled && isActive && tw`text-white bg-blue-600 shadow-md`,
    !disabled && !isActive && tw`text-gray-700 bg-gray-200 dark:bg-dark-accent dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-secondary`
  ]}
` as React.ComponentType<{ isActive?: boolean; disabled?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>>;
