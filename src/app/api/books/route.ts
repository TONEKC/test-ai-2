import { NextResponse } from "next/server";
import { BookCategory, UserRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bookSchema = z.object({
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

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in before viewing the catalog." },
      { status: 401 },
    );
  }

  const books = await prisma.book.findMany({
    orderBy: [{ title: "asc" }, { author: "asc" }],
  });

  return NextResponse.json({ books });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bookSchema.safeParse(await request.json());

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

  const book = await prisma.book.create({
    data: parsed.data,
  });

  return NextResponse.json({ book }, { status: 201 });
}
