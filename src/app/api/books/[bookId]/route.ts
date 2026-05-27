import { NextResponse } from "next/server";
import { BookCategory, UserRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateBookSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  author: z.string().trim().min(1, "Author is required."),
  category: z.enum([
    BookCategory.TEXTBOOK,
    BookCategory.GENERAL,
    BookCategory.NOVEL,
  ]),
  total_copies: z.coerce.number().int().min(0),
  available_copies: z.coerce.number().int().min(0),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ bookId: string }> },
) {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookId } = await context.params;
  const parsed = updateBookSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid book data." },
      { status: 400 },
    );
  }

  if (parsed.data.available_copies > parsed.data.total_copies) {
    return NextResponse.json(
      { error: "Available copies cannot exceed total copies." },
      { status: 400 },
    );
  }

  try {
    const activeLoanCount = await prisma.loan.count({
      where: { bookId, status: "ACTIVE" },
    });
    const checkedOutCopies =
      parsed.data.total_copies - parsed.data.available_copies;

    if (checkedOutCopies < activeLoanCount) {
      return NextResponse.json(
        {
          error:
            "Copies cannot be lower than the number of active loans for this book.",
        },
        { status: 400 },
      );
    }

    const book = await prisma.book.update({
      where: { id: bookId },
      data: parsed.data,
    });

    return NextResponse.json({ book });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ bookId: string }> },
) {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookId } = await context.params;

  const loanCount = await prisma.loan.count({
    where: { bookId },
  });

  if (loanCount > 0) {
    return NextResponse.json(
      { error: "Books with loan history cannot be deleted." },
      { status: 409 },
    );
  }

  try {
    await prisma.book.delete({
      where: { id: bookId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    throw error;
  }
}
