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
    Record<string, { loan_date: string; due_date: string; return_date: string }>
  >(() =>
    Object.fromEntries(
      initialLoans.map((loan) => [
        loan.id,
        {
          loan_date: inputDate(loan.loan_date),
          due_date: inputDate(loan.due_date),
          return_date: new Date().toISOString().slice(0, 10),
        },
      ]),
    ),
  );
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);
  const [savingDatesLoanId, setSavingDatesLoanId] = useState<string | null>(
    null,
  );

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

  const overdueLoans = useMemo(() => {
    const today = new Date();

    return loans.filter((loan) => new Date(loan.due_date) < today);
  }, [loans]);

  function setLoanDate(
    loanId: string,
    key: "loan_date" | "due_date" | "return_date",
    value: string,
  ) {
    setReturnDates((current) => ({
      ...current,
      [loanId]: {
        ...current[loanId],
        [key]: value,
        ...(key === "loan_date" ? { due_date: value } : {}),
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

  async function saveTestDates(loanId: string) {
    setMessage("");
    setSavingDatesLoanId(loanId);

    try {
      const dates = returnDates[loanId];
      const response = await fetch(`/api/loans/${loanId}/dates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_date: dates.loan_date,
          due_date: dates.due_date,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Unable to update loan dates.");
        return;
      }

      setLoans((current) =>
        current.map((loan) =>
          loan.id === data.loan.id
            ? {
                ...loan,
                loan_date: data.loan.loan_date,
                due_date: data.loan.due_date,
              }
            : loan,
        ),
      );
      setMessage(`Saved test dates for ${data.loan.code}.`);
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSavingDatesLoanId(null);
    }
  }

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Active Loans</h2>
          <p className="mt-1 text-sm text-slate-600">
            Return flow includes loan date, due date, and return date overrides
            for fine testing.
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

      <div className="mt-4 border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">Overdue Loans</h3>
            <p className="mt-1 text-sm text-slate-600">
              Active loans past due date are listed here before PDF export.
            </p>
          </div>
          <span className="text-sm font-semibold text-amber-800">
            {overdueLoans.length} overdue
          </span>
        </div>
        {overdueLoans.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-amber-200 text-slate-600">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Member</th>
                  <th className="py-2 pr-4 font-semibold">Book</th>
                  <th className="py-2 pr-4 font-semibold">Due Date</th>
                  <th className="py-2 pr-4 font-semibold">Fine Today</th>
                </tr>
              </thead>
              <tbody>
                {overdueLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-amber-100">
                    <td className="py-3 pr-4 text-slate-600">
                      <div className="font-medium text-slate-950">
                        {loan.user.name}
                      </div>
                      <div>{loan.user.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {loan.book.title}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {new Date(loan.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-amber-800">
                      {calculateClientFine(loan.due_date, new Date()).toLocaleString()}{" "}
                      THB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No overdue loans.</p>
        )}
      </div>

      {filteredLoans.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1240px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-semibold">Code</th>
                <th className="py-2 pr-4 font-semibold">Member</th>
                <th className="py-2 pr-4 font-semibold">Book</th>
                <th className="py-2 pr-4 font-semibold">Current Due Date</th>
                <th className="py-2 pr-4 font-semibold">Override Loan Date</th>
                <th className="py-2 pr-4 font-semibold">Override Due Date</th>
                <th className="py-2 pr-4 font-semibold">Override Return Date</th>
                <th className="py-2 pr-4 font-semibold">Actions</th>
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
                      value={returnDates[loan.id]?.due_date ?? ""}
                      onChange={(event) =>
                        setLoanDate(loan.id, "due_date", event.target.value)
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveTestDates(loan.id)}
                        disabled={savingDatesLoanId === loan.id}
                        className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:text-slate-400"
                      >
                        {savingDatesLoanId === loan.id
                          ? "Saving..."
                          : "Save Test Dates"}
                      </button>
                      <button
                        type="button"
                        onClick={() => markReturned(loan.id)}
                        disabled={returningLoanId === loan.id}
                        className="bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400"
                      >
                        {returningLoanId === loan.id ? "Returning..." : "Return"}
                      </button>
                    </div>
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

function startOfLocalDay(value: Date | string) {
  const date = new Date(value);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isWeekendDay(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function calculateClientFine(dueDateInput: Date | string, returnDateInput: Date) {
  const dueDate = startOfLocalDay(dueDateInput);
  const returnDate = startOfLocalDay(returnDateInput);

  if (returnDate <= dueDate) {
    return 0;
  }

  let weekdays = 0;
  const cursor = new Date(dueDate);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= returnDate) {
    if (!isWeekendDay(cursor)) {
      weekdays += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return weekdays * 20;
}
