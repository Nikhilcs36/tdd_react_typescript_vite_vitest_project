import tw from "twin.macro";

export const ButtonGroup = tw.div`flex flex-wrap justify-center items-center mt-4 gap-1 sm:gap-2 md:gap-3`;
export const Button = tw.button`px-1 sm:px-2 md:px-3 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-1 min-w-[50px] sm:min-w-[55px] md:min-w-[60px] lg:min-w-[70px] justify-center text-xs sm:text-sm truncate`;
export const PageInfo = tw.span`mx-1 sm:mx-2 md:mx-3 px-2 py-1 bg-gray-100 dark:bg-dark-accent text-gray-700 dark:text-dark-text rounded-md font-medium text-xs max-w-[140px] sm:max-w-none truncate sm:whitespace-normal text-center`;
