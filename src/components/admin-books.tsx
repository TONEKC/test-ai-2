"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

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
  const { notify } = useToast();
  const [books, setBooks] = useState(initialBooks);
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  useEffect(() => {
    if (!editingBook) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditingBook(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [editingBook]);

  function formValue(form: FormData, key: string) {
    return String(form.get(key) ?? "");
  }

  async function submitBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      title: formValue(form, "title"),
      author: formValue(form, "author"),
      category: formValue(form, "category"),
      total_copies: Number(formValue(form, "copies")),
      available_copies: Number(formValue(form, "copies")),
    };

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        notify({
          title: "Unable to save book",
          description: data.error ?? "Please check the book details.",
          variant: "error",
        });
        return;
      }

      setBooks((current) => [data.book, ...current]);

      event.currentTarget.reset();
      notify({
        title: "Book saved",
        description: data.book.title,
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
      setIsSaving(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingBook) {
      return;
    }

    setIsUpdating(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      title: formValue(form, "title"),
      author: formValue(form, "author"),
      category: formValue(form, "category"),
      total_copies: Number(formValue(form, "total_copies")),
      available_copies: Number(formValue(form, "available_copies")),
    };

    try {
      const response = await fetch(`/api/books/${editingBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        notify({
          title: "Unable to update book",
          description: data.error ?? "Please check the book details.",
          variant: "error",
        });
        return;
      }

      setBooks((current) =>
        current.map((book) => (book.id === data.book.id ? data.book : book)),
      );
      setEditingBook(null);
      notify({
        title: "Book updated",
        description: data.book.title,
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
      setIsUpdating(false);
    }
  }

  async function deleteBook(book: AdminBook) {
    const confirmed = window.confirm(
      `Delete "${book.title}"? Books with loan history cannot be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingBookId(book.id);

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        notify({
          title: "Unable to delete book",
          description: data.error ?? "Books with loan history cannot be deleted.",
          variant: "error",
        });
        return;
      }

      setBooks((current) =>
        current.filter((currentBook) => currentBook.id !== book.id),
      );
      notify({
        title: "Book deleted",
        description: book.title,
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
      setDeletingBookId(null);
    }
  }

  function openEditModal(book: AdminBook) {
    setEditingBook(book);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_1fr]">
      <section className="self-start border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Add Book</h2>
        <form onSubmit={submitBook} className="mt-4 space-y-3">
          <input
            name="title"
            required
            placeholder="Title"
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          />
          <input
            name="author"
            required
            placeholder="Author"
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          />
          <select
            name="category"
            defaultValue="GENERAL"
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <input
            name="copies"
            type="number"
            min={0}
            required
            defaultValue={1}
            aria-label="Copies"
            className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 flex-1 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-400"
            >
              {isSaving ? "Saving..." : "Save Book"}
            </button>
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(book)}
                        className="border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBook(book)}
                        disabled={deletingBookId === book.id}
                        className="border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {deletingBookId === book.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingBook ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-book-title"
        >
          <div className="w-full max-w-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-amber-700">
                  Catalog Record
                </p>
                <h3
                  id="edit-book-title"
                  className="mt-1 text-xl font-semibold text-slate-950"
                >
                  Edit Book
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBook(null);
                }}
                className="border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitEdit} className="mt-5 space-y-3">
              <input
                key={`${editingBook.id}-title`}
                name="title"
                required
                defaultValue={editingBook.title}
                placeholder="Title"
                className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
              />
              <input
                key={`${editingBook.id}-author`}
                name="author"
                required
                defaultValue={editingBook.author}
                placeholder="Author"
                className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
              />
              <select
                key={`${editingBook.id}-category`}
                name="category"
                defaultValue={editingBook.category}
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
                  key={`${editingBook.id}-total`}
                  name="total_copies"
                  type="number"
                  min={0}
                  required
                  defaultValue={editingBook.total_copies}
                  className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                />
                <input
                  key={`${editingBook.id}-available`}
                  name="available_copies"
                  type="number"
                  min={0}
                  required
                  defaultValue={editingBook.available_copies}
                  className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBook(null);
                  }}
                  className="h-10 border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="h-10 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-400"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
