import tw, { styled } from "twin.macro";

export const SwitcherContainer = styled.div<{ $isLight: boolean }>`
  ${tw`relative flex items-center w-12 h-6 p-1 transition-colors duration-300 rounded-full cursor-pointer`}
  ${({ $isLight }) => $isLight ? tw`bg-blue-400` : tw`bg-gray-700`}
`;

export const IconContainer = styled.div<{ $isLight: boolean; $isRTL: boolean }>`
  ${tw`absolute flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-md`}
  transition: transform 300ms;
  transform: ${({ $isLight, $isRTL }) => {
    if ($isLight) {
      return 'translateX(0)';
    }
    if ($isRTL) {
      return 'translateX(calc(-100% - 4px))';
    }
    return 'translateX(calc(100% + 4px))';
  }};
`;

export const SunIcon = tw.svg`h-4 w-4 text-yellow-500 transition-opacity duration-300`;
export const MoonIcon = tw.svg`h-4 w-4 text-gray-400 transition-opacity duration-300`;