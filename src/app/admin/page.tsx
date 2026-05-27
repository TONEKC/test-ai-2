import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AuthPanel } from "@/components/auth-panel";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (user?.role === UserRole.MEMBER) {
    redirect("/member");
  }

  if (!user) {
    return <AuthPanel mode="admin" />;
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
              Librarian
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {user.name}
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              {user.email}
            </p>
          </aside>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Book Management
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Add and edit book records in the next feature phase.
              </p>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Active Loans
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Return actions, member filtering, date override inputs, and PDF
                reports will be added after this auth deploy is stable.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
