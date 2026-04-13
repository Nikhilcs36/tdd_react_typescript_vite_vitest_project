import tw from "twin.macro";

export const Card = tw.div`bg-white dark:bg-dark-secondary shadow-xl rounded-xl p-6 border border-gray-100 dark:border-dark-accent`;
export const UserContainer = tw.div`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]`;
export const LoadingContainer = tw.div`flex items-center justify-center h-full py-12 col-span-full`;
export const EmptyState = tw.div`col-span-full flex flex-col items-center justify-center py-12`;
export const EmptyIcon = tw.div`w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-dark-secondary`;
export const EmptyTitle = tw.h4`text-lg font-medium text-gray-900 dark:text-dark-text mb-2`;
export const EmptyMessage = tw.p`text-gray-600 dark:text-dark-secondary`;