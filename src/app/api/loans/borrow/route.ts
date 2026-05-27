import { NextResponse } from "next/server";
import { LoanStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { calculateDueDate, isDateOverdue } from "@/lib/date-math";
import { prisma } from "@/lib/prisma";

const borrowSchema = z.object({
  bookId: z.string().uuid(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.MEMBER) {
    return NextResponse.json(
      { error: "Please log in as a member before borrowing." },
      { status: 401 },
    );
  }

  const parsed = borrowSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid book." }, { status: 400 });
  }

  const now = new Date();

  try {
    const loan = await prisma.$transaction(async (tx) => {
      const activeLoans = await tx.loan.findMany({
        where: {
          userId: user.id,
          status: LoanStatus.ACTIVE,
        },
        select: {
          id: true,
          due_date: true,
        },
      });

      if (activeLoans.length >= 3) {
        throw new Error("BORROW_LIMIT");
      }

      if (
        activeLoans.some((activeLoan) =>
          isDateOverdue(activeLoan.due_date, now),
        )
      ) {
        throw new Error("HAS_OVERDUE");
      }

      const book = await tx.book.findUnique({
        where: { id: parsed.data.bookId },
      });

      if (!book) {
        throw new Error("BOOK_NOT_FOUND");
      }

      if (book.available_copies <= 0) {
        throw new Error("NO_COPIES");
      }

      const updateResult = await tx.book.updateMany({
        where: {
          id: book.id,
          available_copies: { gt: 0 },
        },
        data: {
          available_copies: { decrement: 1 },
        },
      });

      if (updateResult.count !== 1) {
        throw new Error("NO_COPIES");
      }

      const dueDate = calculateDueDate(now, book.category);

      return tx.loan.create({
        data: {
          userId: user.id,
          bookId: book.id,
          loan_date: now,
          due_date: dueDate,
          status: LoanStatus.ACTIVE,
        },
        include: {
          book: true,
        },
      });
    });

    return NextResponse.json({
      loan: {
        id: loan.id,
        code: loan.id.slice(0, 8).toUpperCase(),
        loan_date: loan.loan_date,
        due_date: loan.due_date,
        book: loan.book,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BORROW_FAILED";
    const errorMap: Record<string, { status: number; error: string }> = {
      BORROW_LIMIT: {
        status: 400,
        error: "Borrowing limit reached. A member can have at most 3 active loans.",
      },
      HAS_OVERDUE: {
        status: 400,
        error: "You have an overdue active loan. Return it before borrowing again.",
      },
      BOOK_NOT_FOUND: {
        status: 404,
        error: "Book not found.",
      },
      NO_COPIES: {
        status: 400,
        error: "No available copies for this book.",
      },
    };
    const mapped = errorMap[message] ?? {
      status: 500,
      error: "Unable to borrow this book right now.",
    };

    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
