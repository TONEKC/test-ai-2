import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import type { SessionUser } from "@/lib/auth";

type ShellNavItem = {
  href: string;
  label: string;
  description: string;
};

type AppShellProps = {
  user: SessionUser;
  roleLabel: string;
  title: string;
  description: string;
  navItems: ShellNavItem[];
  children: ReactNode;
};

export function AppShell({
  user,
  roleLabel,
  title,
  description,
  navItems,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-5 px-4 py-6 sm:px-6 lg:gap-6 lg:py-8">
        <aside className="col-span-12 border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:col-span-3 lg:self-start">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Library Lending System
          </Link>

          <div className="mt-6 border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-amber-700">
              {roleLabel}
            </p>
            <h2 className="mt-2 break-words text-xl font-semibold text-slate-950">
              {user.name}
            </h2>
            <p className="mt-1 break-words text-sm text-slate-600">
              {user.email}
            </p>
          </div>

          <nav className="mt-5 grid gap-2" aria-label={`${roleLabel} menu`}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition hover:border-amber-700 hover:bg-white"
              >
                <span className="font-semibold text-slate-950">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {item.description}
                </span>
              </a>
            ))}
          </nav>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <LogoutButton />
          </div>
        </aside>

        <div className="col-span-12 grid min-w-0 grid-cols-12 gap-5 lg:col-span-9 lg:gap-6">
          <header className="col-span-12 grid grid-cols-12 gap-4 border border-slate-200 bg-white p-5 shadow-sm">
            <div className="col-span-12 lg:col-span-9">
              <p className="text-sm font-semibold uppercase text-amber-700">
                {roleLabel} Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <div className="col-span-12 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:col-span-3">
              <span className="block text-xs font-semibold uppercase text-amber-700">
                Workspace
              </span>
              <span className="mt-2 block font-semibold text-slate-950">
                Library Dashboard
              </span>
            </div>
          </header>

          <div className="col-span-12 grid grid-cols-12 gap-5 lg:gap-6">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
