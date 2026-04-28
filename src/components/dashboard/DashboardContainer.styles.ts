import tw from "twin.macro";
import { Spinner as CommonSpinner } from "../../components/common/Loading";

export const DashboardContainerWrapper = tw.div`container mx-auto px-4 py-4`;
export const DashboardGrid = tw.div`grid grid-cols-1 gap-4 mb-4 w-full`;
export const ChartGrid = tw.div`grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4`;
export const SectionTitle = tw.h2`text-xl sm:text-2xl font-bold mb-3 dark:text-dark-text`;

// Admin Overview Card
export const AdminOverviewCard = tw.div`p-4 mb-4 bg-white dark:bg-dark-secondary rounded-lg shadow-lg`;
export const AdminOverviewLoading = tw.div`flex items-center justify-center h-32`;
export const AdminOverviewSpinner = tw(CommonSpinner)`w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;
export const AdminOverviewTitle = tw.h3`text-lg font-semibold mb-4 dark:text-dark-text`;
export const AdminOverviewStat = tw.p`text-gray-600 dark:text-gray-400`;
export const AdminOverviewError = tw.div`py-8 text-center text-gray-500 dark:text-gray-400`;