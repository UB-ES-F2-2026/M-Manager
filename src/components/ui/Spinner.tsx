export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Placeholder while the session or the first query is loading. */
export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-brand">
      <Spinner className="size-8" />
      <span className="sr-only">Carregant…</span>
    </div>
  );
}
