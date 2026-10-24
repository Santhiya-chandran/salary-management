# Project Context: Salary Management

## What this is
Web app for ACME's **HR Manager** to manage salary data for **10,000 employees across multiple countries** (currently in Excel) and answer questions about how the org pays people.

Prioritise correctness, readability, and well-tested code over extra features. Keep the solution simple and maintainable.

Full requirements: `docs/requirements.md`. Treat it as the source of truth.

## Status
**The v1 plan is complete (steps 0–21)**, including the stretch items (median salary and the average-salary-by-job-title chart). Deployed on Render. Every technical decision, with its reasoning, is in `docs/decisions.md` (decisions 1–35); read the relevant entries before changing an area. Further work is v2 (see "Out of scope" below and the known limitations in `docs/requirements.md`).

### v1 scope
- **Auth:** HR Manager logs in with email/password (Rails 8 built-in authentication generator, session-based). All pages and APIs require login. One seeded HR user.
- **Employees:** full name, job title, department, country, salary, currency, employment type, hire date.
  - List with server-side pagination, name search, filters (country, department, job title), sorting.
  - Create, edit, delete with validations. Edit changes the *current* salary only.
- **Insights:**
  - min / max / average salary by country
  - average salary by job title within a country
  - headcount by country and department
  - cross-country salary comparison in approximate USD
  - median salary (by country and by job title)
  - bar chart of average salary by job title within a country
- **Seed:** 10,000 deterministic employees (fixed random seed), inserted in batches with `insert_all`, only into an empty table.

### Out of scope for v1 (do not build)
Salary history/audit trail, live or auto-updated exchange rates, editing exchange rates in the UI, roles/permissions, payroll/tax, Excel import/export, bulk edits.

## Tech stack
- Backend: Ruby on Rails 8, PostgreSQL, RSpec, FactoryBot, RuboCop
- Frontend: React (Vite) served from the Rails app via `vite_ruby` (single repo, single deploy, same-origin cookies)
- Component library: Mantine
- Deployment: Render (or similar)

## Commands
Run from the project root. Ruby comes from `.ruby-version` (4.0.5) and Node from `.node-version` (24.15.0). Locally, PostgreSQL credentials come from `PGHOST`, `PGUSER` and `PGPASSWORD` (decision 2).

| Task | Command |
|---|---|
| Install dependencies | `bundle install` and `npm ci` |
| Create, migrate and seed the database | `bin/rails db:create db:migrate db:seed` |
| Seed only (HR login plus 10,000 employees, safe to repeat) | `bin/rails db:seed`. Uses `HR_EMAIL` and `HR_PASSWORD`; outside production it falls back to `hr@acme.example` / `acme-demo-password`. |
| Run the app (two terminals) | `bin/rails server` and `bin/vite dev`, then open http://localhost:3000 |
| Backend specs | `bin/rspec` |
| Frontend tests | `npm test` (Vitest) |
| Frontend typecheck | `npm run typecheck` |
| Ruby lint | `bin/rubocop` |
| Security scans | `bin/brakeman --no-pager` and `bin/bundler-audit` |
| Production frontend build (check bundle sizes) | `bin/vite build` |

CI (`.github/workflows/ci.yml`) runs the security scans, RuboCop, RSpec, the typecheck and Vitest on every push to `main`.

**On this Windows machine:**
- If `bin/...` scripts won't run directly, prefix them with `ruby` (for example `ruby bin/rails server`).
- After adding a migration, run `bin/rails db:test:prepare` by hand; RSpec can't do it itself on Windows.
- When memory is low, Vitest workers or the Vite build can crash; run `npx vitest run --maxWorkers=1` and close other apps.
- Any new script under `bin/` needs a `#!/usr/bin/env ruby` shebang (not `ruby.exe`) and the executable bit (`git update-index --chmod=+x`), or it breaks on Linux CI and Render.

## Engineering rules
- **TDD:** write a failing spec first, then the minimal code to pass, then refactor.
- **Small, incremental steps.** One concern per change, so each can be its own commit.
- **Do not commit.** Propose a commit message after each step; the developer reviews and commits.
- **Thin controllers.** Put business logic in models, service objects, or query objects (e.g. `SalaryInsights::ByCountry`).
- **Aggregations run in SQL** (`GROUP BY`, indexes on country, department, job_title), never by loading records into Ruby.
- **Salaries:** store as decimal (never float) in the country's local currency. Local currency is the source of truth.
- **USD conversion:** derived only, never stored on employees. Use a fixed exchange-rate table in the app with a "rates as of" date; use it only for cross-country comparisons. Within-country insights stay in local currency.
- **Tests:** fast, deterministic, readable. No network calls, no reliance on seed data, no random values without a fixed seed.
- Follow Rails conventions; prefer clarity over cleverness.

## How to work with me
- **Ask before assuming.** If a requirement is unclear, stop and ask.
- **Plan before coding** any non-trivial step, and wait for approval.
- Explain non-obvious decisions briefly so they can be recorded in `docs/`.
- Do not add gems or features beyond the scope above without asking.