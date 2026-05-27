import tw from 'twin.macro';
import styled from 'styled-components';

export const GameContainer = tw.div``;

export const GameTitle = tw.h2`
  text-xl
  sm:text-2xl
  font-bold
  text-gray-900
  dark:text-dark-text
  mb-4
`;

export const GameSubtitle = tw.p`
  text-sm
  text-gray-600
  dark:text-gray-400
  mb-4
`;

export const CanvasWrapper = tw.div`
  relative
  w-full
  max-w-full
  sm:max-w-md
  md:max-w-lg
  mx-auto
  mb-4
  px-2
  sm:px-0
`;

export const GameCanvas = tw.canvas`
  w-full
  aspect-square
  border-2
  border-gray-300
  dark:border-gray-600
  rounded-lg
  cursor-crosshair
  bg-white
  dark:bg-gray-800
  touch-none
`;

export const ControlsContainer = tw.div`
  flex
  flex-col
  sm:flex-row
  gap-3
  justify-center
  mb-4
  px-4
  sm:px-0
`;

export const GameButton = styled.button<{ $variant?: 'primary' | 'secondary'; disabled?: boolean }>(({ $variant }) => [
  tw`w-full px-6 py-2 text-sm font-semibold transition-all duration-200 rounded-lg sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`,
  $variant === 'secondary' ? tw`text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500` : tw`text-white bg-blue-500 hover:bg-blue-600`,
]);

export const StatusContainer = tw.div`
  text-center
  pt-4
`;

export const ScoreDisplay = tw.div`
  text-2xl
  sm:text-4xl
  font-bold
  text-center
  mb-2
`;

export const RatingText = tw.p`
  text-lg
  font-semibold
  text-center
  mb-2
`;

export const BestScoreDisplay = tw.div`
  text-center
  text-sm
  text-gray-600
  dark:text-gray-400
  mb-4
`;

export const ErrorMessage = tw.div`
  text-red-500
  dark:text-red-400
  text-center
  py-2
`;

export const LoadingSpinner = tw.div`
  animate-spin
  rounded-full
  h-8
  w-8
  border-b-2
  border-blue-500
  mx-auto
  mb-2
`;

export const FeatureFlagMessage = tw.div`
  bg-yellow-50
  dark:bg-yellow-900/20
  border
  border-yellow-200
  dark:border-yellow-700
  rounded-lg
  p-4
  text-center
  text-yellow-700
  dark:text-yellow-300
`;