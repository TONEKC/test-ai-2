import { NextResponse } from "next/server";
import { LoanStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { calculateDueDate } from "@/lib/date-math";
import { prisma } from "@/lib/prisma";

const loanDatesSchema = z.object({
  loan_date: z.coerce.date(),
  due_date: z.coerce.date().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ loanId: string }> },
) {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { loanId } = await context.params;
  const parsed = loanDatesSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Loan date is required." },
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

      const loanDate = parsed.data.loan_date;
      const dueDate =
        parsed.data.due_date ??
        calculateDueDate(loanDate, activeLoan.book.category);

      return tx.loan.update({
        where: { id: loanId },
        data: {
          loan_date: loanDate,
          due_date: dueDate,
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
        book: loan.book,
        user: loan.user,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPDATE_FAILED";
    const errorMap: Record<string, { status: number; error: string }> = {
      LOAN_NOT_FOUND: { status: 404, error: "Loan not found." },
      ALREADY_RETURNED: { status: 400, error: "Loan is already returned." },
    };
    const mapped = errorMap[message] ?? {
      status: 500,
      error: "Unable to update loan dates right now.",
    };

    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
