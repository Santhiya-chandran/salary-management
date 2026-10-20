# Project Context: Salary Management

## What this is
Web app for ACME's **HR Manager** to manage salary data for **10,000 employees across multiple countries** (currently in Excel) and answer questions about how the org pays people.

Prioritise correctness, readability, and well-tested code over extra features. Keep the solution simple and maintainable.

Full requirements: `docs/requirements.md`. Treat it as the source of truth.

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
  - (stretch) median
- **Seed:** 10,000 deterministic employees (fixed random seed), inserted in batches with `insert_all`.

### Out of scope for v1 (do not build)
Salary history/audit trail, live or auto-updated exchange rates, editing exchange rates in the UI, roles/permissions, payroll/tax, Excel import/export, bulk edits.

## Tech stack
- Backend: Ruby on Rails 8, PostgreSQL, RSpec, FactoryBot, RuboCop
- Frontend: React (Vite) served from the Rails app via `vite_ruby` (single repo, single deploy, same-origin cookies)
- Component library: Mantine
- Deployment: Render (or similar)

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