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
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Arcane Grand Library
          </Link>
          <div className="flex items-center gap-2">
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

        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase text-amber-700">
            Private Archive
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Sign in before entering the restricted stacks.
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
        </section>
      </div>
    </main>
  );
}
