import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AdminBooks } from "@/components/admin-books";
import { AdminLoans } from "@/components/admin-loans";
import { AppShell } from "@/components/app-shell";
import { AuthPanel } from "@/components/auth-panel";
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

  const [books, loans] = await Promise.all([
    prisma.book.findMany({
      orderBy: [{ title: "asc" }, { author: "asc" }],
    }),
    prisma.loan.findMany({
      include: { user: true, book: true },
      orderBy: { loan_date: "desc" },
    }),
  ]);

  return (
    <AppShell
      user={user}
      roleLabel="Librarian"
      title="Librarian Dashboard"
      description="Manage books, return active loans, and download overdue reports from one signed-in workspace."
      navItems={[
        {
          href: "#books",
          label: "Books",
          description: "Add and edit catalog records",
        },
        {
          href: "#loans",
          label: "Returns",
          description: "Filter active loans and mark returns",
        },
        {
          href: "#all-loans",
          label: "All Loans",
          description: "Review every loan record",
        },
        {
          href: "/api/reports/overdue",
          label: "Overdue PDF",
          description: "Download fine report",
        },
      ]}
    >
      <div id="books" className="col-span-12 scroll-mt-6">
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
      </div>
      <div id="loans" className="col-span-12 scroll-mt-6">
        <AdminLoans
          initialLoans={loans.map((loan) => ({
            id: loan.id,
            code: loan.id.slice(0, 8).toUpperCase(),
            status: loan.status,
            loan_date: loan.loan_date.toISOString(),
            due_date: loan.due_date.toISOString(),
            return_date: loan.return_date?.toISOString() ?? null,
            fine_amount: Number(loan.fine_amount),
            user: {
              name: loan.user.name,
              email: loan.user.email,
            },
            book: {
              title: loan.book.title,
            },
          }))}
        />
      </div>
    </AppShell>
  );
}
