import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { AuthPanel } from "@/components/auth-panel";
import { CatalogClient } from "@/components/catalog-client";
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

  const [loans, books] = await Promise.all([
    prisma.loan.findMany({
      where: { userId: user.id },
      include: { book: true },
      orderBy: { loan_date: "desc" },
    }),
    prisma.book.findMany({
      orderBy: [{ title: "asc" }, { author: "asc" }],
    }),
  ]);
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE");
  const historyLoans = loans.filter((loan) => loan.status === "RETURNED");

  return (
    <AppShell
      user={user}
      roleLabel="Member"
      title="Member Dashboard"
      description="Browse the catalog, borrow available books, and track active and returned loans from one signed-in workspace."
      navItems={[
        {
          href: "#catalog",
          label: "Catalog",
          description: "Browse and borrow books",
        },
        {
          href: "#active-loans",
          label: "Active Loans",
          description: "Current borrowed books",
        },
        {
          href: "#history",
          label: "Past History",
          description: "Returned books and fines",
        },
      ]}
    >
      <section id="catalog" className="col-span-12 scroll-mt-6 space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase text-amber-700">
            Catalog
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Borrow from the live collection
          </h2>
        </div>
        <CatalogClient
          books={books.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            category: book.category,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
          }))}
          isMember
        />
      </section>

      <section
        id="active-loans"
        className="col-span-12 scroll-mt-6 border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-950">Active Loans</h2>
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

      <section
        id="history"
        className="col-span-12 scroll-mt-6 border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-950">Past History</h2>
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
                <span className="ml-2 font-semibold text-amber-800">
                  Fine: {Number(loan.fine_amount).toLocaleString()} THB
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No returned books yet.
          </div>
        )}
      </section>
    </AppShell>
  );
}
