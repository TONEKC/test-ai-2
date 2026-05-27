import assert from "node:assert/strict";
import fs from "node:fs";

function loadDotEnvLocal() {
  if (!fs.existsSync(".env.local")) {
    return;
  }

  for (const line of fs.readFileSync(".env.local", "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);

    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[match[1]] = value;
  }
}

loadDotEnvLocal();

const baseUrl = process.env.BASE_URL ?? "http://[::1]:3000";
const adminIdentifier =
  process.env.LIBRARIAN_USERNAME ?? process.env.LIBRARIAN_EMAIL ?? "admin";
const adminPassword = process.env.LIBRARIAN_PASSWORD;

assert.ok(adminPassword, "LIBRARIAN_PASSWORD is required for live tests.");

function cookieFrom(response) {
  const headers = response.headers;
  const setCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter(Boolean);

  return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function mergeCookie(current, next) {
  return [current, next].filter(Boolean).join("; ");
}

function localDateOnly(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);

  return date;
}

function startOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function lastFridayAndFollowingMonday() {
  const today = startOfToday();
  const friday = new Date(today);
  const daysSinceFriday = (today.getDay() + 2) % 7 || 7;
  friday.setDate(today.getDate() - daysSinceFriday);

  const monday = addDays(friday, 3);

  if (monday > today) {
    friday.setDate(friday.getDate() - 7);
    monday.setDate(monday.getDate() - 7);
  }

  return { friday, monday };
}

function wednesdayThreeWeeksAgo() {
  const today = startOfToday();
  const wednesday = new Date(today);
  const daysSinceWednesday = (today.getDay() + 4) % 7;
  wednesday.setDate(today.getDate() - daysSinceWednesday - 21);

  return wednesday;
}

function subtractWeekdays(count) {
  const date = startOfToday();
  let remaining = count;

  while (remaining > 0) {
    date.setDate(date.getDate() - 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      remaining -= 1;
    }
  }

  return date;
}

function weekdayFine(dueDateInput, returnDateInput) {
  const dueDate = new Date(dueDateInput);
  const returnDate = new Date(returnDateInput);

  if (returnDate <= dueDate) {
    return 0;
  }

  let weekdays = 0;
  const cursor = addDays(dueDate, 1);

  while (cursor <= returnDate) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      weekdays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return weekdays * 20;
}

async function request(path, options = {}) {
  const headers = { ...options.headers };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.arrayBuffer();

  return {
    response,
    data,
    cookie: cookieFrom(response),
    contentType,
  };
}

function expectStatus(result, status, label) {
  assert.equal(
    result.response.status,
    status,
    `${label}: expected HTTP ${status}, got ${result.response.status}`,
  );
}

async function createBook(cookie, title, category, copies) {
  const result = await request("/api/books", {
    method: "POST",
    cookie,
    body: {
      title,
      author: "Live Test",
      category,
      total_copies: copies,
      available_copies: copies,
    },
  });

  expectStatus(result, 201, `create ${category} book`);

  return result.data.book;
}

async function borrow(cookie, bookId, expectedStatus = 200) {
  const result = await request("/api/loans/borrow", {
    method: "POST",
    cookie,
    body: { bookId },
  });

  expectStatus(result, expectedStatus, `borrow ${bookId}`);

  return result;
}

async function updateLoanDates(cookie, loanId, loanDate, dueDate) {
  const result = await request(`/api/loans/${loanId}/dates`, {
    method: "PATCH",
    cookie,
    body: {
      loan_date: localDateOnly(loanDate),
      due_date: localDateOnly(dueDate),
    },
  });

  expectStatus(result, 200, `update loan dates ${loanId}`);

  return result.data.loan;
}

async function returnLoan(cookie, loanId, loanDate, dueDate, returnDate) {
  const result = await request(`/api/loans/${loanId}/return`, {
    method: "POST",
    cookie,
    body: {
      loan_date: localDateOnly(loanDate),
      due_date: localDateOnly(dueDate),
      return_date: localDateOnly(returnDate),
    },
  });

  expectStatus(result, 200, `return loan ${loanId}`);

  return result.data.loan;
}

async function main() {
  let adminCookie = "";
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: {
      identifier: adminIdentifier,
      password: adminPassword,
      role: "LIBRARIAN",
    },
  });
  expectStatus(adminLogin, 200, "admin username login");
  adminCookie = mergeCookie(adminCookie, adminLogin.cookie);

  const runId = Date.now();
  const books = {
    novel: await createBook(adminCookie, `Live Novel ${runId}`, "NOVEL", 2),
    textbook: await createBook(
      adminCookie,
      `Live Textbook ${runId}`,
      "TEXTBOOK",
      2,
    ),
    generalA: await createBook(
      adminCookie,
      `Live General A ${runId}`,
      "GENERAL",
      2,
    ),
    generalB: await createBook(
      adminCookie,
      `Live General B ${runId}`,
      "GENERAL",
      2,
    ),
    zero: await createBook(adminCookie, `Live Empty ${runId}`, "GENERAL", 0),
  };

  let memberCookie = "";
  const password = `LivePass${runId}`;
  const register = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Live Test Member",
      email: `live-${runId}@example.com`,
      phone: `081${String(runId).slice(-7)}`,
      password,
    },
  });
  expectStatus(register, 201, "member signup");
  memberCookie = mergeCookie(memberCookie, register.cookie);

  const catalog = await request("/api/books", { cookie: memberCookie });
  expectStatus(catalog, 200, "member catalog");
  assert.ok(catalog.data.books.length >= 5, "member must see catalog books");

  const today = startOfToday();
  const novelLoan = (await borrow(memberCookie, books.novel.id)).data.loan;
  assert.equal(
    localDateOnly(novelLoan.due_date),
    localDateOnly(addDays(today, 14)),
    "novel due date must be today + 14 days",
  );

  const textbookLoan = (await borrow(memberCookie, books.textbook.id)).data.loan;
  assert.equal(
    localDateOnly(textbookLoan.due_date),
    localDateOnly(addDays(today, 3)),
    "textbook due date must be today + 3 days",
  );

  const wrongPassword = await request("/api/auth/login", {
    method: "POST",
    body: {
      identifier: novelLoan.code,
      password: "wrong-password",
      role: "MEMBER",
    },
  });
  expectStatus(wrongPassword, 401, "member wrong password rejection");

  const loanCodeLogin = await request("/api/auth/login", {
    method: "POST",
    body: {
      identifier: novelLoan.code,
      password,
      role: "MEMBER",
    },
  });
  expectStatus(loanCodeLogin, 200, "member loan-code login");

  const thirdLoan = (await borrow(memberCookie, books.generalA.id)).data.loan;
  const fourthBorrow = await borrow(memberCookie, books.generalB.id, 400);
  assert.match(
    fourthBorrow.data.error,
    /limit/i,
    "4th active borrow must be rejected with a clear limit message",
  );

  const sameDayReturn = await returnLoan(
    adminCookie,
    novelLoan.id,
    today,
    today,
    today,
  );
  assert.equal(Number(sameDayReturn.fine_amount), 0, "same-day fine must be 0");

  const { friday, monday } = lastFridayAndFollowingMonday();
  const mondayReturn = await returnLoan(
    adminCookie,
    textbookLoan.id,
    friday,
    friday,
    monday,
  );
  assert.equal(
    Number(mondayReturn.fine_amount),
    20,
    "Friday due date returned Monday must fine 20 THB",
  );

  const threeWeeksAgo = wednesdayThreeWeeksAgo();
  await updateLoanDates(adminCookie, thirdLoan.id, threeWeeksAgo, threeWeeksAgo);
  const overdueBorrow = await borrow(memberCookie, books.generalB.id, 400);
  assert.match(
    overdueBorrow.data.error,
    /overdue/i,
    "member with active overdue loan must be blocked from borrowing",
  );

  const threeWeekReturn = await returnLoan(
    adminCookie,
    thirdLoan.id,
    threeWeeksAgo,
    threeWeeksAgo,
    today,
  );
  assert.equal(
    Number(threeWeekReturn.fine_amount),
    weekdayFine(threeWeeksAgo, today),
    "three-week fine must count weekdays only",
  );

  const emptyBorrow = await borrow(memberCookie, books.zero.id, 400);
  assert.match(
    emptyBorrow.data.error,
    /No available copies/i,
    "out-of-stock borrow must be rejected clearly",
  );

  const pdfMemberPassword = `PdfPass${runId}`;
  const pdfRegister = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "PDF Overdue Member",
      email: `pdf-${runId}@example.com`,
      phone: `082${String(runId).slice(-7)}`,
      password: pdfMemberPassword,
    },
  });
  expectStatus(pdfRegister, 201, "pdf member signup");
  const pdfMemberCookie = pdfRegister.cookie;
  const pdfLoan = (await borrow(pdfMemberCookie, books.generalB.id)).data.loan;
  const tenWeekdaysAgo = subtractWeekdays(10);
  await updateLoanDates(adminCookie, pdfLoan.id, tenWeekdaysAgo, tenWeekdaysAgo);

  const report = await request("/api/reports/overdue", {
    cookie: adminCookie,
  });
  expectStatus(report, 200, "overdue PDF report");
  assert.match(
    report.contentType,
    /application\/pdf/i,
    "overdue report must be a PDF",
  );
  assert.ok(report.data.byteLength > 1000, "overdue PDF must not be empty");

  await returnLoan(adminCookie, pdfLoan.id, tenWeekdaysAgo, tenWeekdaysAgo, today);

  const deleteEmpty = await request(`/api/books/${books.zero.id}`, {
    method: "DELETE",
    cookie: adminCookie,
  });
  expectStatus(deleteEmpty, 200, "delete unused empty test book");

  console.log("Live lending flow tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
