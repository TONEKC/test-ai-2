import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AuthPanel } from "@/components/auth-panel";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const user = await getCurrentUser();

  if (user?.role === UserRole.LIBRARIAN) {
    redirect("/admin");
  }

  if (!user) {
    return <AuthPanel mode="member" />;
  }

  const loans = await prisma.loan.findMany({
    where: { userId: user.id },
    include: { book: true },
    orderBy: { loan_date: "desc" },
  });
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE");
  const historyLoans = loans.filter((loan) => loan.status === "RETURNED");

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
              Member Account
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {user.name}
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              {user.email}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Catalog
            </Link>
          </aside>

          <div className="space-y-5">
            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Active Loans
              </h2>
              {activeLoans.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Code</th>
                        <th className="py-2 pr-4 font-semibold">Book</th>
                        <th className="py-2 pr-4 font-semibold">Loan Date</th>
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
                            {loan.book.title}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {loan.loan_date.toLocaleDateString()}
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
                <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No active loans.
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Past History
              </h2>
              {historyLoans.length ? (
                <div className="mt-4 space-y-3">
                  {historyLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                    >
                      <span className="font-semibold text-slate-950">
                        {loan.book.title}
                      </span>{" "}
                      returned on {loan.return_date?.toLocaleDateString() ?? "-"}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No returned books yet.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
