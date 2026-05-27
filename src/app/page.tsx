import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (user?.role === UserRole.LIBRARIAN) {
    redirect("/admin");
  }

  if (user?.role === UserRole.MEMBER) {
    redirect("/member");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-rows-[auto_1fr] gap-8 px-4 py-8 sm:px-6">
        <nav className="grid grid-cols-12 items-center gap-3 border-b border-slate-200 pb-5">
          <Link
            href="/"
            className="col-span-12 text-lg font-semibold text-slate-950 sm:col-span-6"
          >
            Library Lending System
          </Link>
          <div className="col-span-12 flex flex-wrap items-center gap-2 sm:col-span-6 sm:justify-self-end">
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

        <section className="grid grid-cols-12 items-center gap-5">
          <div className="col-span-12 space-y-4 lg:col-span-8">
            <p className="text-sm font-semibold uppercase text-amber-700">
              Library Access
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">
              Sign in to use the lending system.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Catalog browsing, categories, borrowing, returns, book management,
              and reports are available only after member or librarian login.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/member"
                className="bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Member Login
              </Link>
              <Link
                href="/admin"
                className="border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Librarian Login
              </Link>
            </div>
          </div>
          <div className="col-span-12 grid gap-3 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
            {["Catalog", "Borrowing", "Overdue reports"].map(
              (item) => (
                <div
                  key={item}
                  className="border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-950 shadow-sm"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
