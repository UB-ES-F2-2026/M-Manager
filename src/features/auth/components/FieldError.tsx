type FieldErrorProps = {
  id: string;
  message?: string;
};

/** Small red message under an input. Renders nothing when there is no error. */
export default function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="flex items-center gap-1 text-xs text-red-600">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 fill-current">
        <path d="M8 1 15 14H1L8 1Zm-.75 5v4h1.5V6h-1.5Zm0 5v1.5h1.5V11h-1.5Z" />
      </svg>
      {message}
    </p>
  );
}
