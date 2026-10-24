# Salary Management

[![CI](https://github.com/Santhiya-chandran/salary-management/actions/workflows/ci.yml/badge.svg)](https://github.com/Santhiya-chandran/salary-management/actions/workflows/ci.yml)

A web app for ACME's HR Manager to manage salary data for 10,000 employees across eight countries. It replaces a spreadsheet and answers questions about how the organisation pays people, such as the salary range in each country, the average salary for a job title in a country, and how countries compare in USD.

Salaries are kept in each country's own currency, which is what employees are actually paid. Comparisons across countries are shown in approximate USD, using fixed reference rates with the rate source and date displayed.

## Live demo

- **App:** `https://salary-management-5wqi.onrender.com`
- **Demo login:** shared by email. To run locally, use `hr@acme.example` / `acme-demo-password` (see below).
- **Video walkthrough:** [Watch on Google Drive](https://drive.google.com/file/d/1SM-dB-WaHHHzbCVHJ5Is3RMNOpX_fQ9A/view?usp=drive_link)

The app runs on Render's free plan, which sleeps after 15 minutes without traffic, so the first request can take about a minute.

## Features

- **Sign-in:** email and password, session-based. Every page and API endpoint requires it.
- **Employees:**
  - a list with server-side pagination, name search, filters (country, department, job title) and sorting (name, salary, hire date). The list's state is kept in the URL, so it survives a refresh and can be shared.
  - add, edit and delete, with validation messages next to each field. Choosing a country fills in its currency. Department and job title suggest existing values, so the same department isn't entered under different spellings. Deleting asks for confirmation.
- **Insights:**
  - by country: minimum, average, median and maximum salary, in local currency;
  - by job title within a country: the same figures, plus a bar chart of average salary;
  - headcount by country and department, with totals;
  - a USD comparison across countries, showing the exchange rate used and its date.
- **Seed data:** 10,000 realistic, deterministic employees and one HR Manager login.

## Tech stack

| Area | Choice |
|---|---|
| Backend | Ruby 4.0.5, Rails 8.1, PostgreSQL 18 |
| Frontend | React 19, TypeScript 6, Vite 8 (through `vite_rails`), Mantine 9 (with `@mantine/charts`), React Router 8 |
| Tests and checks | RSpec and FactoryBot, Vitest and Testing Library, RuboCop, Brakeman, bundler-audit, TypeScript `tsc` |
| CI | GitHub Actions: security scans, lint, RSpec against PostgreSQL, typecheck, Vitest |
| Hosting | Render (native Ruby runtime, free web service and PostgreSQL) |

Rails serves the React app from the same origin, so there is one repository, one deploy, and session cookies with no cross-origin setup.

## Running locally

### Prerequisites

- **Ruby 4.0.5** (see `.ruby-version`). Any version manager works; this project was developed with mise.
- **Node 24.15.0** and npm (see `.node-version`).
- **PostgreSQL 18**, with a role that can create databases. Rails reads the standard `PGHOST`, `PGUSER` and `PGPASSWORD` environment variables, so no credentials go in the repo. For example:
  ```sql
  CREATE ROLE salary_management WITH LOGIN CREATEDB PASSWORD 'choose-a-password';
  ```
  ```bash
  export PGHOST=localhost PGUSER=salary_management PGPASSWORD=choose-a-password
  ```

### Setup

```bash
git clone https://github.com/Santhiya-chandran/salary-management.git
cd salary-management
bundle install
npm ci
bin/rails db:create db:migrate db:seed
```

The seed creates the HR Manager login and 10,000 employees. It's safe to run again: it never duplicates or changes existing employees.

### Start the app

Use two terminals:

```bash
bin/rails server   # http://localhost:3000
bin/vite dev       # optional: instant frontend reloads
```

Without `bin/vite dev`, Rails builds the frontend when a page is requested, which is slower after changes but works.

Sign in with the local demo account: **`hr@acme.example`** / **`acme-demo-password`**. To use other credentials, set `HR_EMAIL` and `HR_PASSWORD` before seeding. Production requires both.

**On Windows**, see the notes under "Commands" in [`CLAUDE.md`](CLAUDE.md). For example, `bin/...` scripts may need a `ruby` prefix (`ruby bin/rails server`), and you need to run `bin/rails db:test:prepare` yourself after adding a migration.

## Running the checks

| Check | Command |
|---|---|
| Backend specs (185) | `bin/rspec` |
| Frontend tests (55) | `npm test` |
| Frontend typecheck | `npm run typecheck` |
| Ruby lint | `bin/rubocop` |
| Security scans | `bin/brakeman --no-pager` and `bin/bundler-audit` |
| Production frontend build | `bin/vite build` |

CI runs all of these except the production build on every push to `main` and on pull requests (`.github/workflows/ci.yml`). The specs don't depend on seed data; each one creates exactly the records it needs.

## Architecture

```
Browser
  │  session cookie (same origin)
  ▼
Rails 8 ─┬─ /session (login page, rendered by Rails)
         ├─ /, /employees/*, /insights/*  → serves the React app (Vite build)
         └─ /api/*  JSON, login required (401 when not signed in)
               │
               ▼
        thin controllers ──► query objects / services ──► PostgreSQL
                             (all counts, totals, averages
                              and medians computed in SQL)
```

| Path | What lives there |
|---|---|
| `app/models/` | `Employee` (validations), `User`, `Country` (the 8 countries, their currencies and the ECB rates) |
| `app/queries/employees/` | the employee list (search, filters, sort, pagination) and the filter options |
| `app/queries/salary_insights/` | by country, by job title, headcount, and the USD comparison, each one SQL `GROUP BY` |
| `app/serializers/` | the JSON shapes. Money is sent as exact decimal strings |
| `app/controllers/api/` | the JSON API. `Api::BaseController` turns every error into a JSON status |
| `app/services/seeds/` | the deterministic demo data and the HR login |
| `app/frontend/` | the React app: `pages/`, a small API client in `lib/api.ts`, and tests next to the code |
| `bin/render-build.sh` | Render's build: install, build the assets, migrate, seed |

## Key decisions

Every decision, with its reasoning, is recorded in [`docs/decisions.md`](docs/decisions.md) (35 entries). The most important:

- **Local currency is the source of truth.** Salaries are stored and shown in the country's own currency, and every within-country figure is exact. USD values are derived only for the cross-country view, using the ECB reference rates of 22 October 2026 kept in code, and are never stored. ([21](docs/decisions.md#21-country-catalogue-in-code-with-ecb-reference-rates))
- **Money is never a float.** Salaries are `decimal(15,2)`, BigDecimal in Ruby, and decimal strings in JSON and in the React app. Even the median is computed exactly in SQL. ([22](docs/decisions.md#22-employee-model-validations-normalisation-and-database-constraints), [24](docs/decisions.md#24-json-api-under-api-with-401-instead-of-a-login-redirect), [34](docs/decisions.md#34-median-salary-and-the-average-salary-by-job-title-chart-stretch))
- **All counts and averages are computed in the database.** Every insight is a SQL `GROUP BY` over indexed columns, and specs check that no employee records are loaded into Ruby. ([27](docs/decisions.md#27-salary-insights-as-sql-aggregate-queries))
- **Thin controllers, logic in query and service objects**, each tested on its own. ([23](docs/decisions.md#23-employee-list-query-search-filters-sorting-and-pagination-in-sql), [29](docs/decisions.md#29-seed-of-10000-demo-employees-deterministic-and-only-into-an-empty-table))
- **One app, one deploy:** React served by Rails through Vite, with a JSON API that returns 401 rather than redirecting. Pages outside the API still redirect to the login page. ([15](docs/decisions.md#15-react-mounted-on-one-rails-page-vite-loaded-only-there), [24](docs/decisions.md#24-json-api-under-api-with-401-instead-of-a-login-redirect))
- **Deterministic seed, safe on every deploy:** a fixed random seed, `insert_all` in one transaction, and it only ever fills an empty table. ([29](docs/decisions.md#29-seed-of-10000-demo-employees-deterministic-and-only-into-an-empty-table))
- **Simple production setup:** one PostgreSQL database, a single Puma process, HTTPS enforced. ([17](docs/decisions.md#17-production-runs-on-one-database-solid-cache-queue-and-cable-removed), [18](docs/decisions.md#18-https-enforced-in-production), [20](docs/decisions.md#20-puma-always-runs-in-single-mode))

## AI usage

I built this with Claude Code. Claude Code worked under the rules in [`CLAUDE.md`](CLAUDE.md): plan before coding,
write tests first, ask before assuming, verify versions and platform support instead of guessing,
and never commit. I reviewed every change, tested each UI step in the browser, and made every commit
myself. How I steered the AI, and where I corrected it, is described in
[`docs/ai-workflow.md`](docs/ai-workflow.md).

## Known limitations

Accepted for v1. Where a decision explains the reasoning, it's linked.

| Limitation | Detail | Decision |
|---|---|---|
| Exchange rates are fixed | USD figures use the ECB rates of 22 October 2026 and are approximate. Updating them means changing the code. | [21](docs/decisions.md#21-country-catalogue-in-code-with-ecb-reference-rates) |
| Sorting by salary across countries mixes currencies | Sorting compares the numbers as they are, so 100,000 INR (about 1,050 USD) sorts above 2,000 USD. The list shows each salary's currency and suggests filtering by country first. | [23](docs/decisions.md#23-employee-list-query-search-filters-sorting-and-pagination-in-sql) |
| Deleting every employee re-seeds the demo data | The seed can't tell "never seeded" from "all deleted", so the next deploy adds the 10,000 demo employees again. | [29](docs/decisions.md#29-seed-of-10000-demo-employees-deterministic-and-only-into-an-empty-table) |
| No password reset by email | The HR password is changed by re-seeding with a new `HR_PASSWORD` (or from the Rails console). | [7](docs/decisions.md#7-password-reset-removed-from-the-generated-authentication) |
| Login rate limit is in memory | Failed-login counting is per process and resets on restart. This is correct while the app runs as one process. | [17](docs/decisions.md#17-production-runs-on-one-database-solid-cache-queue-and-cable-removed), [20](docs/decisions.md#20-puma-always-runs-in-single-mode) |
| Free hosting plan | Render's free web service sleeps after 15 minutes without traffic (about a minute to wake), and the free PostgreSQL database expires 30 days after creation (per Render's docs). Being on the free plan is also why migrations and seeds run in the build script. | [19](docs/decisions.md#19-render-build-script-runs-migrations-and-seeds-free-plan) |
| No Content Security Policy | The Rails default. Adding one (with nonces for Mantine's inline styles) is a post-v1 improvement. | [11](docs/decisions.md#11-frontend-built-with-vite-through-vite_rails-using-npm-and-node-24) |
| No JavaScript linter | Strict TypeScript and Vitest run in CI instead of ESLint. | [13](docs/decisions.md#13-no-eslint-in-v1) |
| Name search has no dedicated index | `ILIKE` is fast enough at 10,000 rows. A `pg_trgm` index can be added if the data grows. | [22](docs/decisions.md#22-employee-model-validations-normalisation-and-database-constraints) |

Features deliberately left out of v1, such as salary history, Excel import and export, and roles, are listed with reasons in [`docs/requirements.md`](docs/requirements.md#deliberately-out-of-scope-v1).
