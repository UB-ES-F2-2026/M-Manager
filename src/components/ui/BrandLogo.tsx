export function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-lg bg-brand text-lg font-semibold text-white"
      >
        M
      </span>
      <span className="text-lg font-semibold text-ink">M-Manager</span>
    </div>
  );
}
