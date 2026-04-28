import tw from "twin.macro";

// Standardized layout components for consistent page design
export const PageContainer = tw.div`min-h-screen bg-gray-50 dark:bg-dark-primary py-8 px-4 sm:px-6`;
export const ContentWrapper = tw.div`max-w-4xl mx-auto space-y-6`;
export const Card = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-6`;
export const PageHeader = tw.div`mb-8`;
export const Title = tw.h1`text-3xl font-bold text-gray-900 dark:text-dark-text mb-2`;
export const Subtitle = tw.p`text-gray-600 dark:text-gray-300`;

// Consistent form layouts
export const FormContainer = tw.div`space-y-4`;
export const FormGroup = tw.div`flex flex-col`;
export const Label = tw.label`mb-1 text-sm font-medium text-gray-700 dark:text-dark-text`;
export const Input = tw.input`p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-accent dark:bg-dark-primary dark:text-dark-text`;
export const ErrorMessage = tw.div`text-red-600 text-sm mt-1`;

// Standard buttons and actions
export const ButtonContainer = tw.div`flex flex-col sm:flex-row gap-2 mt-4 justify-end`;
export const PrimaryButton = tw.button`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed`;
export const SecondaryButton = tw.button`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded`;
export const DangerButton = tw.button`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded`;

// Alerts and messages
export const ErrorAlert = tw.div`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 text-center`;
export const SuccessAlert = tw.div`bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 text-center`;

// Loading and empty states
export const SpinnerContainer = tw.div`text-center py-8`;
export const EmptyState = tw.div`text-center py-8 text-gray-500 dark:text-gray-400`;

// Responsive grid layouts
export const GridLayout = tw.div`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`;