# Library Lending System

Single-repo Next.js App Router project for a library lending system using Prisma and Supabase PostgreSQL.

## Current Phase

Implemented:

- Member register/login at `/member`
- Librarian login at `/admin`
- HTTP-only JWT session cookie auth
- Prisma schema for `User`, `Book`, and `Loan`
- Seed script for librarian user and 5 books
- Subdomain routing support for `member.*` and `admin.*`

Next phase:

- Book CRUD
- Borrowing rules and loan history
- Return flow with `loan_date` and `return_date` overrides
- Weekday-only fine calculation UI
- PDF overdue report

## Environment Variables

Create these in Vercel Project Settings and in `.env.local` for local development:

```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="replace-with-a-random-secret-at-least-32-characters"
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
