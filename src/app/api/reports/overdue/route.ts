import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { LoanStatus, UserRole } from "@prisma/client";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth";
import { calculateOverdueFine, isDateOverdue } from "@/lib/date-math";
import { prisma } from "@/lib/prisma";

const fontPath = join(
  process.cwd(),
  "node_modules",
  "@fontsource",
  "sarabun",
  "files",
  "sarabun-thai-400-normal.woff",
);

const pageSize: [number, number] = [842, 595];
const margin = 32;
const rowFontSize = 9;
const headerFontSize = 9;
const lineHeight = 11;
const columns = [
  { label: "Member", width: 105 },
  { label: "Email", width: 135 },
  { label: "Overdue Book", width: 190 },
  { label: "Due Date", width: 70 },
  { label: "Book Fine", width: 75 },
  { label: "Member Total", width: 85 },
];

type ReportRow = {
  member: string;
  email: string;
  book: string;
  dueDate: string;
  fine: string;
  memberTotal: string;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const normalized = text.trim() || "-";
  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  function pushLongWord(word: string) {
    let segment = "";

    for (const character of word) {
      const candidate = `${segment}${character}`;

      if (font.widthOfTextAtSize(candidate, size) > maxWidth && segment) {
        lines.push(segment);
        segment = character;
      } else {
        segment = candidate;
      }
    }

    current = segment;
  }

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      pushLongWord(word);
    } else {
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawCellLines(
  page: PDFPage,
  lines: string[],
  x: number,
  y: number,
  font: PDFFont,
  size: number,
) {
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color: rgb(0.16, 0.2, 0.29),
    });
  });
}

function drawHeader(page: PDFPage, font: PDFFont, y: number) {
  page.drawRectangle({
    x: margin,
    y: y - 18,
    width: columns.reduce((total, column) => total + column.width, 0),
    height: 24,
    color: rgb(0.9, 0.94, 0.92),
  });

  let x = margin + 6;

  for (const column of columns) {
    page.drawText(column.label, {
      x,
      y: y - 10,
      size: headerFontSize,
      font,
      color: rgb(0.14, 0.29, 0.23),
    });
    x += column.width;
  }
}

function drawReportTitle(
  page: PDFPage,
  font: PDFFont,
  now: Date,
  activeCount: number,
  overdueCount: number,
  totalFines: number,
) {
  page.drawText("Overdue Library Report", {
    x: margin,
    y: 552,
    size: 18,
    font,
    color: rgb(0.1, 0.14, 0.22),
  });
  page.drawText(`Generated: ${now.toLocaleString()}`, {
    x: margin,
    y: 530,
    size: 10,
    font,
    color: rgb(0.38, 0.43, 0.52),
  });
  page.drawText(`Active loans checked: ${activeCount}`, {
    x: margin,
    y: 514,
    size: 10,
    font,
    color: rgb(0.38, 0.43, 0.52),
  });
  page.drawText(`Overdue loans: ${overdueCount}`, {
    x: 210,
    y: 514,
    size: 10,
    font,
    color: rgb(0.38, 0.43, 0.52),
  });
  page.drawText(`Total fines: ${totalFines.toLocaleString()} THB`, {
    x: 360,
    y: 514,
    size: 10,
    font,
    color: rgb(0.38, 0.43, 0.52),
  });
}

function rowToValues(row: ReportRow) {
  return [
    row.member,
    row.email,
    row.book,
    row.dueDate,
    row.fine,
    row.memberTotal,
  ];
}

export async function GET() {
  const user = await getCurrentUser();

  if (user?.role !== UserRole.LIBRARIAN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const activeLoans = await prisma.loan.findMany({
    where: {
      status: LoanStatus.ACTIVE,
    },
    include: { user: true, book: true },
    orderBy: [{ due_date: "asc" }],
  });
  const overdueLoans = activeLoans.filter((loan) =>
    isDateOverdue(loan.due_date, now),
  );
  const finesByMember = overdueLoans.reduce<Record<string, number>>(
    (totals, loan) => {
      totals[loan.userId] =
        (totals[loan.userId] ?? 0) + calculateOverdueFine(loan.due_date, now);

      return totals;
    },
    {},
  );
  const totalFines = overdueLoans.reduce(
    (total, loan) => total + calculateOverdueFine(loan.due_date, now),
    0,
  );
  const rows: ReportRow[] = overdueLoans.length
    ? overdueLoans.map((loan) => {
        const fine = calculateOverdueFine(loan.due_date, now);

        return {
          member: loan.user.name,
          email: loan.user.email,
          book: loan.book.title,
          dueDate: loan.due_date.toLocaleDateString(),
          fine: `${fine.toLocaleString()} THB`,
          memberTotal: `${finesByMember[loan.userId].toLocaleString()} THB`,
        };
      })
    : [
        {
          member: "No overdue loans",
          email: "-",
          book: "Only active loans past due date appear in this report.",
          dueDate: "-",
          fine: "0 THB",
          memberTotal: "0 THB",
        },
      ];

  const pdfDocument = await PDFDocument.create();
  pdfDocument.registerFontkit(fontkit);
  const fontBytes = await readFile(fontPath);
  const font = await pdfDocument.embedFont(fontBytes);
  let page = pdfDocument.addPage(pageSize);
  let y = 486;

  drawReportTitle(
    page,
    font,
    now,
    activeLoans.length,
    overdueLoans.length,
    totalFines,
  );
  drawHeader(page, font, y);
  y -= 34;

  for (const row of rows) {
    const values = rowToValues(row);
    const wrappedValues = values.map((value, index) =>
      wrapText(value, font, rowFontSize, columns[index].width - 12),
    );
    const rowHeight =
      Math.max(...wrappedValues.map((lines) => lines.length)) * lineHeight + 18;

    if (y - rowHeight < margin) {
      page = pdfDocument.addPage(pageSize);
      y = 552;
      drawHeader(page, font, y);
      y -= 34;
    }

    let x = margin + 6;
    wrappedValues.forEach((lines, index) => {
      drawCellLines(page, lines, x, y, font, rowFontSize);
      x += columns[index].width;
    });
    page.drawLine({
      start: { x: margin, y: y - rowHeight + 8 },
      end: {
        x: margin + columns.reduce((total, column) => total + column.width, 0),
        y: y - rowHeight + 8,
      },
      thickness: 0.5,
      color: rgb(0.86, 0.88, 0.92),
    });
    y -= rowHeight;
  }

  const pdf = Buffer.from(await pdfDocument.save());

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="overdue-report-${now.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
