# Library Lending System

Single-repo Next.js App Router project for a library lending system using Prisma and Supabase PostgreSQL.

## Current Phase

Implemented:

- Member registration and member login with email plus password.
- Librarian login at `/admin` with `LIBRARIAN_USERNAME`/`LIBRARIAN_PASSWORD`
  from environment variables.
- Catalog browsing, borrowing, active loans, and loan history behind member
  login.
- Book management behind librarian login, including add, edit modal, and delete
  for books without loan history.
- Librarian loan workspace with member filtering, active returns, overdue
  loans, and all loan records across active and returned status.
- Borrowing validations: max 3 active loans, no borrowing with an active
  overdue loan, and no borrowing when available copies are 0.
- Return flow with editable `loan_date`, `due_date`, and `return_date` for
  senior testing.
- Weekday-only fine calculation at 20 THB per overdue weekday.
- Visible overdue table and PDF export for overdue active loans.
- Subdomain routing support for `member.*` and `admin.*`.

## Environment Variables

Create these in Vercel Project Settings and in `.env.local` for local development:

```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="replace-with-a-random-secret-at-least-32-characters"
LIBRARIAN_USERNAME="admin"
LIBRARIAN_EMAIL="admin@library.local"
LIBRARIAN_PASSWORD="change-this-password"
LIBRARIAN_NAME="Library Admin"
MEMBER_HOST="member.example.com"
ADMIN_HOST="admin.example.com"
```

Do not commit `.env.local`.

## Local Setup

Use Node 20 or newer.

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open:

- `http://localhost:3000/member`
- `http://localhost:3000/admin`

## Supabase Setup

1. Create a Supabase project.
2. Copy the session pooler PostgreSQL connection string.
3. Replace `[PASSWORD]` with the database password. URL-encode special characters, for example `!` becomes `%21`.
4. Set `DATABASE_URL` in Vercel and local `.env.local`.
5. Run `npm run db:push` once to create tables.
6. Run `npm run db:seed` once to create the librarian and sample books.

## Vercel CI/CD

1. Push this repo to GitHub.
2. Import the GitHub repo in Vercel.
3. Add all environment variables in Vercel.
4. Use the default build command: `npm run build`.
5. Vercel will auto-deploy on every push to the connected branch.

## Subdomains

This repo supports separate member and librarian URLs in one Vercel project.

Example:

- `member.example.com` rewrites to `/member`
- `admin.example.com` rewrites to `/admin`

In Vercel:

1. Add both custom domains to the same project.
2. Set `MEMBER_HOST` to the member domain.
3. Set `ADMIN_HOST` to the admin domain.
4. Configure DNS records as Vercel instructs.

Role checks still happen server-side. URL separation is only routing, not authorization.

## Senior Testing Notes

The required date override is available after librarian login:

1. Open `/admin`.
2. Go to `Active Loans`.
3. Use `Override Loan Date`, `Override Due Date`, and `Override Return Date`.
4. Click `Save Test Dates` to make an active loan overdue without returning it.
5. Click `Return` to mark the loan returned and calculate the fine.

For the Friday-to-Monday fine test, set `Override Due Date` to Friday and
`Override Return Date` to the following Monday. The expected fine is 20 THB
because only Monday is counted.

Automated checks:

```bash
npm run test:core
```

This validates due-date and fine math without needing a database.

With a working `.env.local` containing `DATABASE_URL`, `JWT_SECRET`, and
librarian credentials, run:

```bash
npm run dev
BASE_URL="http://[::1]:3000" npm run test:live
```

`test:live` registers members, creates test books, verifies novel/textbook due
dates, email login, loan-code login rejection, wrong-password rejection, 3-loan
limit, overdue blocking, same-day fine, Friday-to-Monday fine, weekday-only fine,
out-of-stock rejection, and overdue PDF export.
