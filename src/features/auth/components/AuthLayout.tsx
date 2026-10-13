import type { ReactNode } from "react";
import { BrandLogo } from "../../../components/ui/BrandLogo";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-white sm:flex sm:items-center sm:justify-center sm:bg-surface sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-10 sm:rounded-3xl sm:border sm:border-line sm:bg-white sm:px-10 sm:shadow-sm">
        <BrandLogo />
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="text-base text-muted">{subtitle}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
