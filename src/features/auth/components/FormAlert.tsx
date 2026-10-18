type FormAlertProps = {
  title: string;
  description: string;
};

/** Red box at the top of an auth form for errors that are not tied to one field. */
export default function FormAlert({ title, description }: FormAlertProps) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2.5"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 size-4 shrink-0 text-danger"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-danger">{title}</p>
        <p className="text-xs text-slate-700">{description}</p>
      </div>
    </div>
  );
}
