import assert from "node:assert/strict";
import { BookCategory } from "@prisma/client";
import { calculateDueDate, calculateOverdueFine } from "../src/lib/date-math";

function date(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

assert.equal(
  dateOnly(calculateDueDate(date("2026-05-27"), BookCategory.NOVEL)),
  "2026-06-10",
  "novel loans must be due 14 calendar days after loan date",
);

assert.equal(
  dateOnly(calculateDueDate(date("2026-05-27"), BookCategory.TEXTBOOK)),
  "2026-05-30",
  "textbook loans must be due 3 calendar days after loan date",
);

assert.equal(
  calculateOverdueFine(date("2026-05-27"), date("2026-05-27")),
  0,
  "same-day due and return must always have zero fine",
);

assert.equal(
  calculateOverdueFine(date("2026-05-22"), date("2026-05-25")),
  20,
  "Friday due date returned Monday must count only Monday as one fine day",
);

assert.equal(
  calculateOverdueFine(date("2026-05-06"), date("2026-05-27")),
  300,
  "three-week overdue range must count weekdays only",
);

assert.equal(
  calculateOverdueFine(date("2026-05-22"), date("2026-05-24")),
  0,
  "weekend-only overdue range must not accrue a fine",
);

console.log("Core date math tests passed.");
