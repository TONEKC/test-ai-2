import { NextResponse } from "next/server";
import { LoanStatus, UserRole } from "@prisma/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getCurrentUser } from "@/lib/auth";
import { calculateOverdueFine } from "@/lib/date-math";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const overdueLoans = await prisma.loan.findMany({
    where: {
      status: LoanStatus.ACTIVE,
      due_date: { lt: now },
    },
    include: { user: true, book: true },
    orderBy: [{ due_date: "asc" }],
  });

  const rows = overdueLoans.map((loan) => {
    const fine = calculateOverdueFine(loan.due_date, now);

    return [
      loan.user.name,
      loan.user.email,
      loan.book.title,
      loan.due_date.toLocaleDateString(),
      `${fine.toLocaleString()} THB`,
    ];
  });
  const totalFines = overdueLoans.reduce(
    (total, loan) => total + calculateOverdueFine(loan.due_date, now),
    0,
  );

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Overdue Library Report", 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, 26);
  doc.text(`Total fines: ${totalFines.toLocaleString()} THB`, 14, 32);

  autoTable(doc, {
    startY: 40,
    head: [["Member", "Email", "Overdue Book", "Due Date", "Fine"]],
    body: rows.length
      ? rows
      : [["No overdue loans", "-", "-", "-", "0 THB"]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [23, 74, 58] },
  });

  const pdf = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="overdue-report-${now.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
