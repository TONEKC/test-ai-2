"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";

type CatalogBook = {
  id: string;
  title: string;
  author: string;
  category: "TEXTBOOK" | "GENERAL" | "NOVEL";
  total_copies: number;
  available_copies: number;
};

type BorrowResult = {
  code: string;
  due_date: string;
  book: CatalogBook;
};

type CatalogClientProps = {
  books: CatalogBook[];
  isMember: boolean;
};

function categoryLabel(category: CatalogBook["category"]) {
  return {
    TEXTBOOK: "Textbook",
    GENERAL: "General",
    NOVEL: "Novel",
  }[category];
}

export function CatalogClient({ books, isMember }: CatalogClientProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [borrowResult, setBorrowResult] = useState<BorrowResult | null>(null);
  const [borrowingBookId, setBorrowingBookId] = useState<string | null>(null);

  async function borrow(bookId: string) {
    if (!isMember) {
      router.push("/member");
      return;
    }

    setBorrowResult(null);
    setBorrowingBookId(bookId);

    try {
      const response = await fetch("/api/loans/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await response.json();

      if (!response.ok) {
        notify({
          title: "Unable to borrow book",
          description: data.error ?? "Please try again.",
          variant: "error",
        });
        return;
      }

      setBorrowResult(data.loan);
      notify({
        title: "Borrowed successfully",
        description: `${data.loan.book.title} due ${new Date(data.loan.due_date).toLocaleDateString()}`,
        variant: "success",
      });
      router.refresh();
    } catch {
      notify({
        title: "Network error",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setBorrowingBookId(null);
    }
  }

  return (
    <div className="space-y-5">
      {borrowResult ? (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="font-semibold">Borrowed successfully</div>
          <div className="mt-1">
            Loan reference:{" "}
            <span className="font-semibold">{borrowResult.code}</span>
          </div>
          <div>
            Due date:{" "}
            <span className="font-semibold">
              {new Date(borrowResult.due_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {books.map((book) => (
          <article
            key={book.id}
            className="flex min-h-[220px] flex-col justify-between border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                  {categoryLabel(book.category)}
                </span>
                <span className="text-xs text-slate-500">
                  {book.available_copies}/{book.total_copies} available
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {book.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{book.author}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => borrow(book.id)}
              disabled={book.available_copies <= 0 || borrowingBookId === book.id}
              className="mt-5 h-10 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {borrowingBookId === book.id
                ? "Borrowing..."
                : book.available_copies <= 0
                  ? "Unavailable"
                  : "Borrow"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
