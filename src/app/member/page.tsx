import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AuthPanel } from "@/components/auth-panel";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const user = await getCurrentUser();

  if (user?.role === UserRole.LIBRARIAN) {
    redirect("/admin");
  }

  if (!user) {
    return <AuthPanel mode="member" />;
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Library Lending System
          </Link>
          <LogoutButton />
        </nav>

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">
              Member Account
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {user.name}
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              {user.email}
            </p>
          </aside>

          <div className="space-y-5">
            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Active Loans
              </h2>
              <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Borrowing and loan history will be added in the next phase.
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Past History
              </h2>
              <div className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Returned books and fines will appear here after the loan module
                is implemented.
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
