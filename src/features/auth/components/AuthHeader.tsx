type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

/** App logo, title and subtitle shown at the top of the auth screens. */
export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-800 text-sm font-semibold text-white">
          M
        </span>
        <span className="text-sm font-semibold text-slate-900">M-Manager</span>
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </header>
  );
}
