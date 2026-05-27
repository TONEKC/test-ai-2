"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AdminBook = {
  id: string;
  title: string;
  author: string;
  category: "TEXTBOOK" | "GENERAL" | "NOVEL";
  total_copies: number;
  available_copies: number;
};

type AdminBooksProps = {
  initialBooks: AdminBook[];
};

const categories = [
  { value: "TEXTBOOK", label: "Textbook" },
  { value: "GENERAL", label: "General" },
  { value: "NOVEL", label: "Novel" },
] as const;

export function AdminBooks({ initialBooks }: AdminBooksProps) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function formValue(form: FormData, key: string) {
    return String(form.get(key) ?? "");
  }

  async function submitBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      title: formValue(form, "title"),
      author: formValue(form, "author"),
      category: formValue(form, "category"),
      total_copies: Number(formValue(form, "total_copies")),
      available_copies: Number(formValue(form, "available_copies")),
    };
    const endpoint = editingBook ? `/api/books/${editingBook.id}` : "/api/books";

    try {
      const response = await fetch(endpoint, {
        method: editingBook ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Unable to save book.");
        return;
      }

      if (editingBook) {
        setBooks((current) =>
          current.map((book) => (book.id === data.book.id ? data.book : book)),
        );
      } else {
        setBooks((current) => [data.book, ...current]);
      }

      setEditingBook(null);
      event.currentTarget.reset();
      setMessage("Book saved.");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          {editingBook ? "Edit Book" : "Add Book"}
        </h2>
        <form onSubmit={submitBook} className="mt-4 space-y-3">
          <input
            key={editingBook?.id ?? "new-title"}
            name="title"
            required
            defaultValue={editingBook?.title}
            placeholder="Title"
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          />
          <input
            key={editingBook?.id ?? "new-author"}
            name="author"
            required
            defaultValue={editingBook?.author}
            placeholder="Author"
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          />
          <select
            key={editingBook?.id ?? "new-category"}
            name="category"
            defaultValue={editingBook?.category ?? "GENERAL"}
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              key={`${editingBook?.id ?? "new"}-total`}
              name="total_copies"
              type="number"
              min={0}
              required
              defaultValue={editingBook?.total_copies ?? 1}
              className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
            />
            <input
              key={`${editingBook?.id ?? "new"}-available`}
              name="available_copies"
              type="number"
              min={0}
              required
              defaultValue={editingBook?.available_copies ?? 1}
              className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
            />
          </div>

          {message ? (
            <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 flex-1 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-400"
            >
              {isSaving ? "Saving..." : "Save Book"}
            </button>
            {editingBook ? (
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="h-10 border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Books</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-semibold">Title</th>
                <th className="py-2 pr-4 font-semibold">Author</th>
                <th className="py-2 pr-4 font-semibold">Category</th>
                <th className="py-2 pr-4 font-semibold">Copies</th>
                <th className="py-2 pr-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-950">
                    {book.title}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{book.author}</td>
                  <td className="py-3 pr-4 text-slate-600">{book.category}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {book.available_copies}/{book.total_copies}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => setEditingBook(book)}
                      className="border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
