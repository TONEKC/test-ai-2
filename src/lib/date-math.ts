import { addDays, isAfter, isSameDay, isWeekend, startOfDay } from "date-fns";
import { BookCategory } from "@prisma/client";

const LOAN_DAYS_BY_CATEGORY: Record<BookCategory, number> = {
  TEXTBOOK: 3,
  GENERAL: 7,
  NOVEL: 14,
};

export function calculateDueDate(
  loanDate: Date,
  category: BookCategory,
): Date {
  return addDays(loanDate, LOAN_DAYS_BY_CATEGORY[category]);
}

export function countWeekdaysBetweenDueAndReturn(
  dueDateInput: Date,
  returnDateInput: Date,
): number {
  const dueDate = startOfDay(dueDateInput);
  const returnDate = startOfDay(returnDateInput);

  if (isSameDay(dueDate, returnDate) || !isAfter(returnDate, dueDate)) {
    return 0;
  }

  let weekdays = 0;
  let cursor = addDays(dueDate, 1);

  while (!isAfter(cursor, returnDate)) {
    if (!isWeekend(cursor)) {
      weekdays += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return weekdays;
}

export function calculateOverdueFine(
  dueDate: Date,
  returnDate: Date,
  ratePerWeekday = 20,
): number {
  return countWeekdaysBetweenDueAndReturn(dueDate, returnDate) * ratePerWeekday;
}
