import tw from "twin.macro";

export const ButtonGroup = tw.div`flex justify-center items-center mt-6 gap-3`;
export const Button = tw.button`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 min-w-[100px] justify-center`;
export const PageInfo = tw.span`mx-4 px-3 py-2 bg-gray-100 dark:bg-dark-accent text-gray-700 dark:text-dark-text rounded-md font-medium text-sm`;