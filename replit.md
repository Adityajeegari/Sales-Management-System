# Sales OS

A production-grade Sales Management System built as a clean, Google-quality web app for sales managers.

## What it does

- **Marketing landing page** with a hero, animated KPI mockup, and feature grid.
- **Authentication** via Clerk (email + Google), branded sign-in/sign-up pages.
- **Dashboard** with KPI cards (revenue, orders, customers, AOV), 12-month revenue area chart, category mix pie chart, recent sales feed, top products, and a 3-month AI sales forecast.
- **Sales** CRUD with search, status filters, customer linking, dialog-based create/edit, and delete confirmation.
- **Customers** CRUD with search, lifetime spend, order count, and a per-customer detail view showing full purchase history.
- **Reports** with monthly and yearly tabs, growth %, and one-click CSV export.
- **Settings** for profile review, dark/light theme toggle, and sign-out.
- **Dark mode** site-wide via `next-themes`.

## Architecture

Monorepo (pnpm workspaces).

```
artifacts/
  sales-os/      React + Vite frontend (port from $PORT, base /sales-os)
  api-server/    Express API (mounted at /api)
  mockup-sandbox/ Component preview sandbox (Replit canvas tooling)
lib/
  db/            Drizzle schema + Postgres client
  api-spec/      OpenAPI spec → generates client
  api-client-react/ Generated TanStack Query hooks + types
```

### Backend (`artifacts/api-server`)

- `src/app.ts` mounts: pino logging → Clerk proxy → CORS → JSON → `clerkMiddleware()` → `/api` router.
- Routes (`src/routes/`):
  - `sales.ts` — list (with `search` & `status` filters), create, get, update, delete. Server computes `total = price * quantity`.
  - `customers.ts` — CRUD, includes `totalSpent` and `orderCount` (SQL aggregation), detail returns embedded sales array.
  - `analytics.ts` — `/dashboard/summary`, `/sales/trend`, `/categories/distribution`, `/products/top`, `/sales/recent`, `/sales/forecast` (linear regression on last 6 months).
  - `reports.ts` — `/reports/monthly?year=YYYY`, `/reports/yearly`. Computes growth % vs prior period.
- Cancelled sales are excluded from revenue / forecasts.
- `requireAuth` middleware uses `getAuth(req)` and checks `sessionClaims.userId || userId`.

### Database (`lib/db`)

PostgreSQL via Drizzle, pushed with `pnpm db:push`.

- `customers` — `id` (serial), `name`, `email` (unique), `phone?`, `company?`, `notes?`, timestamps.
- `sales` — `id` (serial), `productName`, `category`, `price` (numeric), `quantity` (int), `total` (numeric, server-computed), `status` enum (`pending` | `completed` | `cancelled`), `saleDate`, `customerId?` FK→customers (set null on delete), `notes?`, timestamps.

### Frontend (`artifacts/sales-os`)

- `App.tsx` — `ClerkProvider` (with shadcn theme + branded appearance), `WouterRouter` with `base={basePath}`, all routes wrapped with a `Protected` component for auth-gated pages.
- `components/layout/app-shell.tsx` — sidebar nav, mobile sheet, theme toggle, user dropdown.
- `pages/marketing.tsx` — public landing with framer-motion hero.
- `pages/dashboard.tsx` — Recharts area + pie + KPI cards + forecast.
- `pages/sales.tsx` & `pages/customers.tsx` — table view + dialog forms + alert-dialog deletion.
- `pages/customer-detail.tsx` — profile card + purchase table.
- `pages/reports.tsx` — monthly/yearly tabs + CSV export via `lib/csv.ts`.
- `pages/settings.tsx` — profile read-only + theme toggle + sign out.
- `components/theme-provider.tsx` — `next-themes` with `class` attribute, default light.
- Toasts via `sonner` (top-right).

### Generated client (`lib/api-client-react`)

Generated from `lib/api-spec/openapi.yaml`. Hooks like `useListSales`, `useCreateSale`, `useGetDashboardSummary`. Mutations take `{ data }` for body, `{ id, data }` for body+id, `{ id }` for delete.

## Conventions

- All API mutations followed by `qc.invalidateQueries(getXxxQueryKey())` to refresh caches.
- Currency display via `lib/format.ts` (`formatCurrency`, `formatCompactCurrency`).
- Status badge variants: `completed` → default, `pending` → secondary, `cancelled` → outline.
- Dark mode toggled by adding/removing `class="dark"` on `<html>`.

## Auth setup

Clerk is provisioned via `setupClerkWhitelabelAuth`. Required secrets:
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` (auto-set).
- `SESSION_SECRET` (already present).
- `DATABASE_URL` (Postgres, already present).

Sign-in/sign-up routes are `/sign-in/*?` and `/sign-up/*?` (the trailing `*?` is required for Clerk OAuth subpaths).

## Seed data

22 sample sales over 12 months across 3 customers (Olivia Carter, Marcus Reyes, Priya Iyer). Categories: Software, Services, Hardware. Mix of `completed`, `pending`, and `cancelled` statuses for realistic charts.
