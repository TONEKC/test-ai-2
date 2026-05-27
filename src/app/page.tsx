import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-16">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Library Lending System
          </Link>
          <div className="flex gap-2">
            <Link
              href="/member"
              className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Member
            </Link>
            <Link
              href="/admin"
              className="bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Librarian
            </Link>
          </div>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Phase 1 Ready
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">
              Member registration and librarian login are wired for Supabase.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              This first deployable version includes Prisma models, seed data,
              password hashing, JWT session cookies, member registration, member
              login, and librarian login from environment variables.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/member"
                className="bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Open Member Access
              </Link>
              <Link
                href="/admin"
                className="border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Open Admin
              </Link>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Next features
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Book CRUD and searchable catalog</li>
              <li>Borrow action with active-loan limits and due dates</li>
              <li>Return workflow with date override test backdoor</li>
              <li>Weekday-only fine calculation and PDF overdue report</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
