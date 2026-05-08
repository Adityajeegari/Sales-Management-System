# Rename plan: Clerk -> Sales OS (branding)

Purpose
- Provide a safe, staged process to replace internal names and user-facing branding.

Scope and constraints
- Keep third-party package names (`@clerk/*`) unchanged.
- Preserve runtime env var names (`CLERK_*`) unless you coordinate deploy changes.
- Perform DB/API identifier renames behind feature flags and with migrations.

High-level steps
1. Create a feature branch: `rename/clerk-to-salesos`.
2. Run the provided codemod (see `scripts/`) in dry-run mode to list candidate edits.
3. Review codemod results and commit safe changes (UI/provider wrapper adoption already done).
4. Prepare DB migration(s): add new columns, backfill from old `clerk_*` columns, switch reads/writes, drop old columns in a later release.
5. Update OpenAPI and client code (version the API if fields change).
6. Run full monorepo build and tests (`pnpm -w -r build`, `pnpm -w -r test`).
7. Deploy to staging, run smoke tests, then roll out to production.

Mapping examples
- UI wrapper: `SalesOsProvider` (local) → already added at `artifacts/sales-os/src/lib/salesos.ts`.
- Hooks: `useClerk`, `useUser` → re-exported from wrapper.
- API/DB fields (optional): `clerkUserId` → `salesOsUserId` (requires migration).
- Env vars: KEEP `CLERK_*` or add aliases in deployment (preferred).

Codemod guidance
- Use `scripts/rename-clerk-to-salesos-codemod.ts` (ts-morph) to preview/execute renames.
- Run with `pnpm dlx ts-node -- files` (example usage in the script header).

DB migration strategy (zero-downtime)
1. Add new column `sales_os_user_id` (nullable).
2. Backfill: `UPDATE ... SET sales_os_user_id = clerk_user_id WHERE sales_os_user_id IS NULL;` (run in batches for large tables).
3. Deploy code that writes both columns (dual-write) and reads prefer `sales_os_user_id` if present.
4. After monitoring, switch reads exclusively to `sales_os_user_id`.
5. In a later release, drop `clerk_user_id` after another monitoring window.

Testing and rollout
- Run `pnpm -w -r build` locally and in CI.
- Add migration acceptance tests for backfill and dual-write behavior.
- Stage deploy, verify auth flows, user sessions, and data integrity.

Rollback plan
- Keep old DB columns and env var names for at least two deploy cycles.
- If rollback needed, re-enable code that reads/writes the old column.

- Notes
- User-facing mentions (marketing, docs, login UI) will be changed to "Sales OS"; technical package names and env var identifiers (e.g., `@clerk/*`, `CLERK_*`) are preserved by default unless you request deeper renames.
- I will not change package.json/dependencies or env var names without explicit confirmation.
- If you approve, I can generate a targeted codemod run and the initial Drizzle migration file.
