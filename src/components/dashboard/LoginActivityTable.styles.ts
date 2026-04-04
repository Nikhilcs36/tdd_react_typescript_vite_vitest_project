import tw, { styled } from "twin.macro";

export const TableContainer = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4 mb-6 min-h-[400px]`;
export const TableHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
export const TableTitle = tw.h3`text-lg font-semibold dark:text-dark-text`;
export const Table = tw.table`w-full mt-4`;
export const TableHead = tw.thead`bg-gray-50 dark:bg-gray-800`;
export const TableHeaderCell = tw.th`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300`;
export const TableBody = tw.tbody`divide-y divide-gray-200 dark:divide-gray-700`;
export const TableRow = tw.tr`hover:bg-gray-50 dark:hover:bg-gray-800`;
export const TableCell = tw.td`px-4 py-2 text-sm text-gray-700 dark:text-gray-300`;

export const StatusBadge = styled.span<{ $isSuccess: boolean }>`
  ${tw`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
  ${({ $isSuccess }) => $isSuccess
    ? tw`text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200`
    : tw`text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200`
  }
`;

export const LoadingSpinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
export const EmptyState = tw.div`text-center text-gray-500 dark:text-gray-400 py-8`;

export const LoadMoreContainer = tw.div`flex flex-col items-center mt-4 space-y-2`;
export const LoadMoreButton = tw.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`;
export const AllLoadedMessage = tw.div`text-sm text-gray-500 dark:text-gray-400`;