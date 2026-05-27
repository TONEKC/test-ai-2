import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AdminBooks } from "@/components/admin-books";
import { AuthPanel } from "@/components/auth-panel";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (user?.role === UserRole.MEMBER) {
    redirect("/member");
  }

  if (!user) {
    return <AuthPanel mode="admin" />;
  }

  const [books, activeLoans] = await Promise.all([
    prisma.book.findMany({
      orderBy: [{ title: "asc" }, { author: "asc" }],
    }),
    prisma.loan.findMany({
      where: { status: "ACTIVE" },
      include: { user: true, book: true },
      orderBy: { due_date: "asc" },
      take: 20,
    }),
  ]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Enchanted Library
          </Link>
          <LogoutButton />
        </nav>

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-700">
              Librarian
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {user.name}
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              {user.email}
            </p>
          </aside>

          <div className="space-y-5">
            <AdminBooks
              initialBooks={books.map((book) => ({
                id: book.id,
                title: book.title,
                author: book.author,
                category: book.category,
                total_copies: book.total_copies,
                available_copies: book.available_copies,
              }))}
            />
            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Active Loans
              </h2>
              {activeLoans.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Code</th>
                        <th className="py-2 pr-4 font-semibold">Member</th>
                        <th className="py-2 pr-4 font-semibold">Book</th>
                        <th className="py-2 pr-4 font-semibold">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLoans.map((loan) => (
                        <tr key={loan.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-semibold text-slate-950">
                            {loan.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {loan.user.name}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {loan.book.title}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {loan.due_date.toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  No active loans yet.
                </p>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
