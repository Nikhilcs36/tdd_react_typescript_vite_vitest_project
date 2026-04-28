import tw from "twin.macro";

export const UserListContainer = tw.div`bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6 mb-8 h-[420px] overflow-y-auto`;
export const UserListHeader = tw.h3`text-lg font-semibold mb-6 dark:text-dark-text`;
export const UserItemContainer = tw.div`flex items-center space-x-3 p-3 border-b border-gray-200 dark:border-dark-accent last:border-b-0`;
export const UserCheckbox = tw.input`w-4 h-4 text-blue-600 rounded focus:ring-blue-500`;
export const UserInfo = tw.div`flex-1`;
export const UserName = tw.div`font-medium text-gray-900 dark:text-dark-text`;
export const UserEmail = tw.div`text-sm text-gray-500 dark:text-gray-400`;
export const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400 py-4`;
export const EmptyMessage = tw.div`text-center text-gray-500 dark:text-dark-text py-8`;
export const PaginationContainer = tw.div`flex flex-wrap justify-center items-center mt-4 gap-1 sm:gap-2 md:gap-3`;
export const PaginationButton = tw.button`px-1 sm:px-2 md:px-3 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center min-w-[50px] sm:min-w-[55px] md:min-w-[60px] lg:min-w-[70px] text-xs sm:text-sm truncate`;
export const UsersScrollArea = tw.div`h-[250px] overflow-y-auto mb-4`;
export const CenteredContainer = tw.div`flex items-center justify-center h-full`;
export const UsersList = tw.div`space-y-2`;
export const PageInfoText = tw.span`mx-1 sm:mx-2 md:mx-3 px-3 py-2 bg-gray-100 dark:bg-dark-accent text-gray-700 dark:text-dark-text rounded-md font-medium text-xs max-w-[160px] sm:max-w-none truncate sm:whitespace-normal text-center`;
