import tw, { styled } from "twin.macro";

export const FormWrapper = tw.div`min-h-[80vh] flex items-center justify-center bg-gray-100 dark:bg-dark-primary`;

export const Form = styled.form.attrs((props: { lang?: string }) => ({
  lang: props.lang || "en",
}))<{ lang?: string }>`
  ${tw`w-full p-4 bg-white rounded-lg shadow-md dark:bg-dark-secondary`}
  ${({ lang }) =>
    lang === "ml" ? tw`max-w-xl` : lang === "ar" ? tw`max-w-md` : tw`max-w-sm`}
`;

export const Title = tw.h2`text-xl font-bold mb-3 dark:text-dark-text`;
export const Label = tw.label`block text-gray-700 dark:text-dark-text font-medium mb-1`;
export const Input = tw.input`w-full px-3 py-0.5 border border-gray-300 dark:border-dark-accent rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-dark-primary dark:text-dark-text`;
export const Button = styled.button<{ disabled?: boolean }>(({ disabled }) => [
  tw`px-4 py-2 mt-2 text-white transition-all bg-blue-500 rounded hover:bg-blue-600`,
  disabled && tw`bg-gray-400 cursor-not-allowed hover:bg-gray-400`,
]);

export const SuccessMessage = tw.div`mt-3 p-3 text-green-700 bg-green-100 rounded text-center`;
export const ErrorWrapper = tw.div`relative mb-6 min-h-[20px]`;
export const ErrorMessage = tw.div`absolute top-full left-0 mt-1 text-red-700 text-sm min-h-[20px] leading-tight`;