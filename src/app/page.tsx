import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CatalogClient } from "@/components/catalog-client";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, books] = await Promise.all([
    getCurrentUser(),
    prisma.book.findMany({
      orderBy: [{ title: "asc" }, { author: "asc" }],
    }),
  ]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Library Lending System
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  {user.name}
                </span>
                <Link
                  href={user.role === UserRole.LIBRARIAN ? "/admin" : "/member"}
                  className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>

        <section className="space-y-3">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Catalog
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">
            Browse books and borrow from the live collection.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Members can borrow up to 3 active books. Borrowing is blocked when a
            member has overdue active loans or when no copies are available.
          </p>
        </section>

        <CatalogClient
          books={books.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            category: book.category,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
          }))}
          isMember={user?.role === UserRole.MEMBER}
        />
      </div>
    </main>
  );
}
