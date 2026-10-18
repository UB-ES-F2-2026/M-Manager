import type { ReactNode } from "react";

type SubmitButtonProps = {
  isLoading: boolean;
  loadingText: string;
  children: ReactNode;
};

/** Full-width primary submit button with a spinner while loading. */
export default function SubmitButton({ isLoading, loadingText, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      aria-busy={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed"
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
}
