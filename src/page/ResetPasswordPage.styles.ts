import tw, { styled } from "twin.macro";

export const FormWrapper = tw.div`min-h-[60vh] flex items-center justify-center bg-gray-100 dark:bg-dark-primary px-4`;

export const Form = tw.form`w-full max-w-lg p-4 bg-white rounded-lg shadow-md dark:bg-dark-secondary`;

export const Title = tw.h2`text-xl font-bold mb-3 dark:text-dark-text`;
export const Label = tw.label`block text-gray-700 dark:text-dark-text font-medium mb-1`;
export const Input = tw.input`w-full px-3 py-2 border border-gray-300 dark:border-dark-accent rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-dark-primary dark:text-dark-text`;
export const Button = styled.button<{ disabled?: boolean }>(({ disabled }) => [
  tw`px-4 py-2 mt-2 text-white transition-all bg-blue-500 rounded hover:bg-blue-600`,
  disabled && tw`bg-gray-400 cursor-not-allowed hover:bg-gray-400`,
]);

export const ErrorWrapper = tw.div`mb-4`;
export const ErrorMessage = tw.div`mt-1 text-red-700 text-sm`;
export const ApiErrorMessage = tw.div`mb-4 p-3 text-red-700 bg-red-100 rounded text-center`;
export const SuccessMessage = tw.div`mb-4 p-3 text-green-700 bg-green-100 rounded text-center`;
export const LinkWrapper = tw.div`mt-4 text-center`;