import tw, { styled } from "twin.macro";
import { Spinner as CommonSpinner } from "../../components/common/Loading";

export const Card = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4 min-h-[280px]`;
export const CardHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
export const CardTitle = tw.h3`text-lg font-semibold dark:text-dark-text`;
export const StatsContainer = tw.div`mt-4 grid grid-cols-2 gap-4`;
export const StatItem = tw.div`text-center`;
export const StatValue = tw.div`text-2xl font-bold text-blue-600 dark:text-blue-400`;
export const StatLabel = tw.div`text-sm text-gray-600 dark:text-gray-400`;

export const TrendIndicator = styled.span<{ $isPositive: boolean }>`
  ${tw`ml-1 text-sm font-medium`}
  ${({ $isPositive }) => $isPositive ? tw`text-green-600 dark:text-green-400` : tw`text-red-600 dark:text-red-400`}
`;

export const TrendValue = styled.span`
  ${tw`text-lg font-semibold`}
`;

export const LoadingSpinner = tw(CommonSpinner)`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
export const LoadingContainer = tw.div`flex items-center justify-center h-32`;
export const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400`;