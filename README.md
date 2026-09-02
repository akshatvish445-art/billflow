# BillFlow

BillFlow is a complete full-stack invoicing SaaS for freelancers and small studios. It uses **Next.js route handlers as the backend**, PostgreSQL + Prisma for persistence, bcrypt password hashing, signed HTTP-only session cookies, optional Resend email delivery, public invoice tokens, and simulated demo payments.

The project is aligned to the supplied Full Stack Intern (AI) technical assessment, which explicitly allows **Next.js route handlers** as the backend.

## What is included

- Public landing page with sign-up CTA.
- Sign up, login and logout with bcrypt password hashes and signed 7-day HTTP-only sessions.
- Strict tenant isolation: protected database queries are always scoped to the authenticated user's ID.
- Client CRUD: name, email, company, address and phone.
- Invoice creation with unlimited practical line items, quantity/rate, automatic subtotal, discount and tax calculations, dates, notes and statuses.
- Atomic invoice numbering per workspace so concurrent invoice creation cannot reuse a number.
- Server-side invoice search, status/client filtering, sorting and pagination through both the server-rendered invoice list and `/api/invoices`.
- Responsive invoice view with browser **Print** plus a protected server-generated **Download PDF** endpoint.
- Shareable public invoice URL with a random 256-bit token; clients do not need an account.
- Optional real email delivery through Resend, with safe demo-send fallback when credentials are not configured.
- Simulated public payment and authenticated **Mark paid** workflow.
- Dashboard for total earned, outstanding, overdue, recent invoices and six-month income history.
- Settings for business name, logo, currency and invoice prefix, reflected on invoices.
- Automatic overdue presentation based on due date; no manual status update is required.
- Loading, empty and error states plus mobile-responsive layouts.
- PostgreSQL migrations and deterministic demo seed data.

## Demo account

Email: `demo@billflow.app`  
Password: `Demo@12345`

The seed creates four invoices: one paid, one sent, one overdue and one draft. The sent demo invoice has a stable public token:

`/invoice/demo-nst-1002-public`

## Tech stack

- Next.js + React + TypeScript
- Tailwind CSS
- Next.js route handlers / REST-style JSON API
- PostgreSQL
- Prisma ORM + migration files
- bcryptjs + jose
- Recharts
- Optional Resend email API

## Backend API

Protected endpoints require the BillFlow session cookie created by `/api/auth/login` or `/api/auth/signup`.

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Clients

- `GET /api/clients?q=&page=&pageSize=`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

### Invoices

- `GET /api/invoices?q=&status=&clientId=&sort=&page=&pageSize=`
- `POST /api/invoices`
- `GET /api/invoices/:id`
- `PATCH /api/invoices/:id`
- `DELETE /api/invoices/:id`
- `POST /api/invoices/:id/send`
- `POST /api/invoices/:id/pay`
- `GET /api/invoices/:id/pdf` — authenticated direct PDF download

Supported list status values: `all`, `draft`, `sent`, `paid`, `overdue`. Supported sort values: `newest`, `oldest`, `due-soon`.

### Public invoice

- `GET /api/public/invoices/:token`
- `POST /api/public/invoices/:token/pay`

Draft invoices are intentionally not exposed through the public invoice endpoint.

### Settings / health

- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/health`

## Run locally

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `AUTH_SECRET`.
3. Install dependencies:

```bash
npm install
```

4. Generate the Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:deploy
```

5. Seed the demo account/data:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — long random secret used to sign session cookies
- `NEXT_PUBLIC_APP_URL` — public application URL used in share/email links
- `RESEND_API_KEY` — optional Resend API key
- `RESEND_FROM_EMAIL` — optional verified Resend sender

No real secrets belong in source control.

## Database migrations

`prisma/migrations/0001_init/migration.sql` creates the initial schema.  
`prisma/migrations/0002_invoice_sequence/migration.sql` adds an atomic per-user invoice sequence used by the backend to prevent invoice-number races.

## Deployment

The assessment requires a live deployed website and repository/README deliverables.

A standard deployment is:

1. Push this repository to GitHub.
2. Import it into a Next.js-capable host such as Vercel.
3. Provision managed PostgreSQL.
4. Add `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` and optional Resend variables.
5. Build with:

```text
prisma generate && next build
```

6. Apply migrations against production:

```bash
npm run db:deploy
```

7. Seed the demo environment:

```bash
npm run db:seed
```

For production, use a strong randomly generated `AUTH_SECRET`, a real `NEXT_PUBLIC_APP_URL`, and a verified email sender if email delivery is required.

## Product assessment mapping

The supplied brief asks for landing page, accounts, clients, invoices, server-side invoice filtering, printable/PDF invoice viewing, sending/share links, public invoice payment, dashboard analytics, settings, automatic overdue handling, responsive behavior, and loading/empty/error states.

All of those areas are represented in the repository. The brief also gives bonus credit for creative/final-product details, so BillFlow includes atomic invoice numbering, public-token hardening, pagination, optional Resend delivery and additional JSON endpoints.

## Suggested assessment demo

Landing → sign in with demo account → dashboard → clients → create invoice → save → send/share → open public invoice without login → simulated payment → return to invoice → settings → logo/currency/prefix → server-side invoice filters → Download PDF → Print.
