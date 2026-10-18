/** Full-screen spinner while Convex checks the session. */
export default function SessionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-primary-soft border-t-primary"
      />
      <span className="sr-only">Carregant…</span>
    </main>
  );
}
