/** "M" badge + app name, shown at the top of the auth screens. */
export default function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-white"
      >
        M
      </span>
      <span className="text-sm font-semibold text-slate-900">M-Manager</span>
    </div>
  );
}
