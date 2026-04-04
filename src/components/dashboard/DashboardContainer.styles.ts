import tw from "twin.macro";

export const DashboardContainerWrapper = tw.div`container mx-auto px-4 py-8`;
export const DashboardGrid = tw.div`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8`;
export const ChartGrid = tw.div`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8`;
export const SectionTitle = tw.h2`text-2xl font-bold mb-6 dark:text-dark-text`;

// Admin Overview Card
export const AdminOverviewCard = tw.div`p-6 mb-8 bg-white dark:bg-dark-secondary rounded-lg shadow-lg min-h-[200px]`;
export const AdminOverviewLoading = tw.div`flex items-center justify-center h-32`;
export const AdminOverviewSpinner = tw.div`w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;
export const AdminOverviewTitle = tw.h3`text-lg font-semibold mb-4 dark:text-dark-text`;
export const AdminOverviewStat = tw.p`text-gray-600 dark:text-gray-400`;
export const AdminOverviewError = tw.div`py-8 text-center text-gray-500 dark:text-gray-400`;