import { NextResponse } from "next/server";
import { LoanStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { calculateDueDate, calculateOverdueFine } from "@/lib/date-math";
import { prisma } from "@/lib/prisma";

const returnSchema = z.object({
  loan_date: z.coerce.date(),
  return_date: z.coerce.date(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { loanId } = await context.params;
  const parsed = returnSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Loan date and return date are required." },
      { status: 400 },
    );
  }

  const loanDate = parsed.data.loan_date;
  const returnDate = parsed.data.return_date;

  if (returnDate < loanDate) {
    return NextResponse.json(
      { error: "Return date cannot be before loan date." },
      { status: 400 },
    );
  }

  try {
    const loan = await prisma.$transaction(async (tx) => {
      const activeLoan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { book: true, user: true },
      });

      if (!activeLoan) {
        throw new Error("LOAN_NOT_FOUND");
      }

      if (activeLoan.status !== LoanStatus.ACTIVE) {
        throw new Error("ALREADY_RETURNED");
      }

      const dueDate = calculateDueDate(loanDate, activeLoan.book.category);
      const fineAmount = calculateOverdueFine(dueDate, returnDate);

      await tx.book.update({
        where: { id: activeLoan.bookId },
        data: {
          available_copies: { increment: 1 },
        },
      });

      return tx.loan.update({
        where: { id: loanId },
        data: {
          loan_date: loanDate,
          due_date: dueDate,
          return_date: returnDate,
          status: LoanStatus.RETURNED,
          fine_amount: fineAmount,
        },
        include: { book: true, user: true },
      });
    });

    return NextResponse.json({
      loan: {
        id: loan.id,
        code: loan.id.slice(0, 8).toUpperCase(),
        loan_date: loan.loan_date,
        due_date: loan.due_date,
        return_date: loan.return_date,
        fine_amount: Number(loan.fine_amount),
        book: loan.book,
        user: loan.user,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RETURN_FAILED";
    const errorMap: Record<string, { status: number; error: string }> = {
      LOAN_NOT_FOUND: { status: 404, error: "Loan not found." },
      ALREADY_RETURNED: { status: 400, error: "Loan is already returned." },
    };
    const mapped = errorMap[message] ?? {
      status: 500,
      error: "Unable to return this loan right now.",
    };

    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
