import tw from "twin.macro";

export const UserListContainer = tw.div`bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6 mb-8 h-[420px] overflow-y-auto`;
export const UserListHeader = tw.h3`text-lg font-semibold mb-6 dark:text-dark-text`;
export const UserItemContainer = tw.div`flex items-center space-x-3 p-3 border-b border-gray-200 dark:border-dark-accent last:border-b-0`;
export const UserCheckbox = tw.input`w-4 h-4 text-blue-600 rounded focus:ring-blue-500`;
export const UserInfo = tw.div`flex-1`;
export const UserName = tw.div`font-medium text-gray-900 dark:text-dark-text`;
export const UserEmail = tw.div`text-sm text-gray-500 dark:text-gray-400`;
export const LoadingSpinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;
export const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400 py-4`;
export const EmptyMessage = tw.div`text-center text-gray-500 dark:text-dark-text py-8`;
export const PaginationContainer = tw.div`flex justify-between items-center mt-4`;
export const PaginationButton = tw.button`w-20 px-4 py-2 bg-blue-600 text-white flex justify-center items-center rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed`;
export const UsersScrollArea = tw.div`h-[250px] overflow-y-auto mb-4`;
export const CenteredContainer = tw.div`flex items-center justify-center h-full`;
export const UsersList = tw.div`space-y-2`;
export const PageInfoText = tw.span`text-sm text-gray-600 dark:text-gray-400`;