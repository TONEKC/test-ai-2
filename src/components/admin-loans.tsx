"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminLoan = {
  id: string;
  code: string;
  loan_date: string;
  due_date: string;
  user: {
    name: string;
    email: string;
  };
  book: {
    title: string;
  };
};

type AdminLoansProps = {
  initialLoans: AdminLoan[];
};

function inputDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function AdminLoans({ initialLoans }: AdminLoansProps) {
  const router = useRouter();
  const [loans, setLoans] = useState(initialLoans);
  const [memberFilter, setMemberFilter] = useState("");
  const [message, setMessage] = useState("");
  const [returnDates, setReturnDates] = useState<
    Record<string, { loan_date: string; return_date: string }>
  >(() =>
    Object.fromEntries(
      initialLoans.map((loan) => [
        loan.id,
        {
          loan_date: inputDate(loan.loan_date),
          return_date: new Date().toISOString().slice(0, 10),
        },
      ]),
    ),
  );
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);

  const filteredLoans = useMemo(() => {
    const term = memberFilter.trim().toLowerCase();

    if (!term) {
      return loans;
    }

    return loans.filter(
      (loan) =>
        loan.user.name.toLowerCase().includes(term) ||
        loan.user.email.toLowerCase().includes(term),
    );
  }, [loans, memberFilter]);

  function setLoanDate(loanId: string, key: "loan_date" | "return_date", value: string) {
    setReturnDates((current) => ({
      ...current,
      [loanId]: {
        ...current[loanId],
        [key]: value,
      },
    }));
  }

  async function markReturned(loanId: string) {
    setMessage("");
    setReturningLoanId(loanId);

    try {
      const dates = returnDates[loanId];
      const response = await fetch(`/api/loans/${loanId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dates),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Unable to return loan.");
        return;
      }

      setLoans((current) => current.filter((loan) => loan.id !== loanId));
      setMessage(
        `Returned ${data.loan.code}. Fine: ${Number(data.loan.fine_amount).toLocaleString()} THB.`,
      );
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setReturningLoanId(null);
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Active Loans</h2>
          <p className="mt-1 text-sm text-slate-600">
            Return flow includes loan date and return date overrides for testing.
          </p>
        </div>
        <a
          href="/api/reports/overdue"
          className="bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Download Overdue PDF
        </a>
      </div>

      <input
        value={memberFilter}
        onChange={(event) => setMemberFilter(event.target.value)}
        placeholder="Filter by member name or email"
        className="mt-4 h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
      />

      {message ? (
        <div className="mt-4 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </div>
      ) : null}

      {filteredLoans.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-semibold">Code</th>
                <th className="py-2 pr-4 font-semibold">Member</th>
                <th className="py-2 pr-4 font-semibold">Book</th>
                <th className="py-2 pr-4 font-semibold">Due Date</th>
                <th className="py-2 pr-4 font-semibold">Override Loan Date</th>
                <th className="py-2 pr-4 font-semibold">Override Return Date</th>
                <th className="py-2 pr-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-semibold text-slate-950">
                    {loan.code}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    <div className="font-medium text-slate-950">
                      {loan.user.name}
                    </div>
                    <div>{loan.user.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{loan.book.title}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {new Date(loan.due_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="date"
                      value={returnDates[loan.id]?.loan_date ?? ""}
                      onChange={(event) =>
                        setLoanDate(loan.id, "loan_date", event.target.value)
                      }
                      className="h-9 border border-slate-300 px-2 text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="date"
                      value={returnDates[loan.id]?.return_date ?? ""}
                      onChange={(event) =>
                        setLoanDate(loan.id, "return_date", event.target.value)
                      }
                      className="h-9 border border-slate-300 px-2 text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => markReturned(loan.id)}
                      disabled={returningLoanId === loan.id}
                      className="bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400"
                    >
                      {returningLoanId === loan.id ? "Returning..." : "Return"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          No active loans match this filter.
        </p>
      )}
    </section>
  );
}
