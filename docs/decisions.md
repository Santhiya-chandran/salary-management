# Decisions

Short records of technical decisions and the reasons for them. Product decisions (scope, currency approach) live in `requirements.md`.

Entries are numbered in the order they were made. When a decision replaces an earlier one, it gets a new numbered entry, and the old entry is marked "Superseded by decision N." rather than edited or removed.

## 1. Ruby 4.0.5 and Rails 8.1.4

- **Decision:** Use Ruby 4.0.5 and Rails 8.1.4, the current versions at the start of the project. Rails 8.1 supports Ruby 4.0.
- **Verified:** A test deploy confirmed that Render's native Ruby runtime installs Ruby 4.0.5 and all gems successfully, so no Docker deployment or Ruby downgrade is needed.
- **Consequence:** `Gemfile.lock` lists both the Windows and `x86_64-linux` platforms, so the same lockfile works locally and on Render (Linux).

## 2. Database credentials come from environment variables

- **Decision:** `config/database.yml` reads the standard PostgreSQL variables `PGHOST` (default `localhost`), `PGUSER` and `PGPASSWORD`. Locally, the app connects as a dedicated `salary_management` role with `CREATEDB`, not as the `postgres` superuser.
- **Why:** Credentials stay out of the repo. Using the standard variable names means `psql` and Rails share the same settings.
- **Production:** Render provides `DATABASE_URL`, which takes priority over these values. The production setup will be finalised with the first deploy.

## 3. App generated without Rails' JavaScript setup, Minitest or Jbuilder

- **Decision:** The app was generated with `rails new . -d postgresql -T --skip-javascript --skip-jbuilder`.
- **Why:**
  - **No JavaScript setup:** the frontend is React built with Vite through `vite_ruby`, so importmap, Turbo and Stimulus would be unused.
  - **No Minitest (`-T`):** the project uses RSpec instead.
  - **No Jbuilder:** the API's JSON is small and built in plain Ruby, which avoids a template layer for a handful of endpoints.

## 4. Kamal removed; the Dockerfile is kept

- **Decision:** Removed the `kamal` gem, `config/deploy.yml`, `.kamal/` and `bin/kamal`. The generated `Dockerfile` stays.
- **Why:** We deploy to Render, which builds and runs the app itself, so Kamal's tooling for deploying to self-managed servers would be unused config.
- **Fallback:** Keeping the `Dockerfile` means the app can still be deployed as a container if a native Render build stops working.

## 5. RSpec with FactoryBot; specs run in random order

- **Decision:** Use `rspec-rails` and `factory_bot_rails` for tests, with no fixtures and no `shoulda-matchers`. Specs run in random order, and a `FactoryBot.lint` spec checks that every factory and trait builds a valid record.
- **Why:**
  - **Factories:** each spec sets up exactly the data it needs, which keeps tests readable and independent of seed data.
  - **No `shoulda-matchers`:** validations are tested with plain expectations, which keeps the gem list short.
  - **Random order:** catches specs that depend on each other. RSpec prints the seed it used, and `bin/rspec --seed N` reruns in the same order, so failures can be reproduced exactly.
  - **Factory lint:** a broken factory fails in one clearly named spec, rather than as confusing errors in every spec that uses it.

## 6. CI runs the specs against a PostgreSQL service

- **Decision:** A `test` job in `.github/workflows/ci.yml` starts a PostgreSQL 18 service, runs `bin/rails db:test:prepare`, then `bin/rspec`. The workflow runs on pushes to `main` (the generated workflow used `master`, so it never ran on pushes) and on pull requests.
- **Why:** PostgreSQL 18 matches the local version. The job connects with the same `PGHOST`, `PGUSER` and `PGPASSWORD` variables as local development (decision 2), so there's no CI-only database config.

## 7. Password reset removed from the generated authentication

- **Decision:** Deleted the password-reset controller, mailer, views and routes that the Rails 8 authentication generator creates, and the "Forgot password?" link on the login page. A request spec checks that `/passwords/new` returns 404.
- **Why:** v1 has one seeded HR Manager login and no email delivery set up. A reset flow that can't send email would be dead code and an unused attack surface. If the password needs changing, it's reset from the Rails console or by re-seeding with new `HR_EMAIL` and `HR_PASSWORD` values.
- **Also:** `resource :session` is limited to `new`, `create` and `destroy`, the only actions `SessionsController` has, so no routes point at missing actions.

## 8. User validations on top of the generated model

- **Decision:** `User` validates that `email_address` is present, looks like an email (`URI::MailTo::EMAIL_REGEXP`) and is unique, and that `password` is at least 12 characters. The length check is skipped when the password isn't being changed (`allow_nil: true`).
- **Why:** The generator only adds a unique database index, so a duplicate email would surface as a database error instead of a validation message. `has_secure_password` enforces only a maximum length (72 bytes), so the minimum has to be added. 12 characters was agreed as the minimum.

## 9. HR Manager login seeded from environment variables

- **Decision:** `db/seeds.rb` calls `Seeds::HrManager`, which creates the HR Manager user from `HR_EMAIL` and `HR_PASSWORD`, or resets the password if that user already exists. Outside production, missing variables fall back to demo credentials (`hr@acme.example` / `acme-demo-password`). In production, missing variables stop the seed with an error.
- **Why:**
  - **Environment variables:** keep the real production password out of the repo.
  - **Demo fallback:** a fresh checkout can log in straight after `db:seed`.
  - **Password reset on re-run:** gives a way to change the password without a reset flow (decision 7).
  - **Service object:** the logic lives outside `db/seeds.rb` so it can be tested with a plain hash in place of `ENV`. The employee seed in step 15 will sit next to it in `app/services/seeds/`.
- **Timing:** the HR user is seeded now, ahead of the 10,000 employees, so the first Render deploy has a working login.

## 10. Login page styled with plain CSS

- **Decision:** The server-rendered login page is styled with plain CSS in `app/assets/stylesheets/application.css`, served by Propshaft. Colours and font are CSS variables chosen to match Mantine's defaults. Class names are scoped by prefix (`auth-card__…`, `auth-form__…`) so they won't clash with Mantine's styles later.
- **Why:** The login page is rendered by Rails rather than React (it's part of the generated authentication), so it can't use Mantine components. Plain CSS needs no new gems or build step, and the matching colours keep it visually consistent with the React app.
- **Accessibility:** every field has a `<label>`, and login errors use `role="alert"` so screen readers announce them. Request specs check both.

## 11. Frontend built with Vite through vite_rails, using npm and Node 24

- **Decision:** `vite_rails` builds the frontend from `app/frontend/`. npm is the package manager, with `package-lock.json` committed. Node is pinned to `24.15.0` in `.node-version`, and `package.json` declares `"engines": { "node": "^24.15.0" }`.
- **Why:**
  - **Node pin:** 24.15.0 is the local version. Render's docs say Node is available in every native runtime, including Ruby, and they list `.node-version` as a way to choose the version, ahead of `engines`. The docs don't say explicitly that this applies to non-Node services, so the first deploy had to confirm it. Confirmed: the first deploy’s build log showed Node 24.15.0 read from .node-version.
  - **`engines` upper bound:** Render recommends one, so a new Node major isn't picked up silently.
  - **npm:** already installed, so no extra tooling is needed.
- **Security:** the vite_ruby installer installed `vite` 8.0.0, which has a high-severity advisory (path traversal and file read in the dev server). The lockfile was updated to `vite` 8.3.5 and `vite-plugin-ruby` 5.2.6, and the minimum versions in `package.json` were raised to match, so a fresh install can't fall back. `npm audit` reports 0 vulnerabilities.
- **CSP hints not kept:** the installer also added commented-out Content Security Policy hints to `config/initializers/content_security_policy.rb`. They were reverted, so the file stays as Rails generated it. The app has no CSP, which is the Rails default. Turning one on (with nonces, because Mantine injects inline styles) is a possible post-v1 improvement.

## 12. Two terminals for local development, no foreman

- **Decision:** Run `bin/vite dev` and `bin/rails server` in two terminals. The vite_ruby installer generated a `Procfile.dev` listing both processes. It was deleted, because nothing would run it.
- **Why:** running both from one command needs the `foreman` gem, which is an extra gem and less reliable on Windows. If the Vite dev server isn't running, vite_ruby builds on demand (`autoBuild`), so a single `rails server` still works, just with slower page loads after frontend changes.

## 13. No ESLint in v1

- **Decision:** No JavaScript or TypeScript linter for v1. Strict TypeScript (`npm run typecheck`) and the Vitest specs run in CI instead.
- **Trade-off:** ESLint would catch some problems the type checker misses: React hook rules (such as missing `useEffect` dependencies), unused imports when `noUnusedLocals` isn't enough, and inconsistent style. For a small, single-developer frontend with a short deadline, strict types and tests cover the higher-risk mistakes. ESLint (with `eslint-plugin-react-hooks`) is the first thing to add if the frontend grows.

## 14. TypeScript 6.0, matching Vite's React + TypeScript template

- **Decision:** `typescript ~6.0.3`, with the compiler options from Vite's official `react-ts` template (`create-vite` 9.3.1) plus an explicit `"strict": true`. `npm run typecheck` runs `tsc -b` across `tsconfig.app.json` (the frontend code) and `tsconfig.node.json` (the Vite and Vitest config files).
- **Why:** TypeScript 7.0 is the newest release, but Vite's own template still pins 6.0. Following the template keeps the toolchain on a combination the Vite team tests. Strict mode is set explicitly so it can't change silently with a future TypeScript default.

## 15. React mounted on one Rails page; Vite loaded only there

- **Decision:** `GET /` renders `<div id="root" data-user-email="…">`, and React mounts on it. The Vite tags are added from that view, not the layout, so the Rails-rendered login page loads no JavaScript. Sign-out is a plain HTML form inside the React app that posts `_method=delete` with the CSRF token read from the `csrf-token` meta tag.
- **Why:**
  - **Email as a data attribute:** the signed-in email is the only data the shell needs, so it doesn't justify an API endpoint yet.
  - **Plain sign-out form:** Rails handles it exactly like any other form post.
  - **Shared CSRF helper:** `app/frontend/lib/csrf.ts` will also be used by the API requests in later steps.
  - **Login styles scoped:** the login page's styles moved from `body` onto `.auth-page`, so they don't override Mantine's global styles on the React page.
- **Testing:** Vitest has its own `vitest.config.ts` (React plugin, jsdom, Mantine's recommended browser stubs) and doesn't load the Ruby plugin. The request spec for the CSRF meta tag turns forgery protection on, because the test environment disables it and hides the tag.

## 16. CI checks the frontend too

- **Decision:** CI installs Node from `.node-version` with `actions/setup-node@v7` and runs `npm ci` (with npm caching) in two places:
  - **`test` job:** before the RSpec run, because request specs that render the React page trigger a Vite build;
  - **new `frontend` job:** runs `npm run typecheck` and `npm test` (Vitest).
- **Why:** CI reads the Node version from the same `.node-version` file as Render and local development (decision 11). `npm ci` installs exactly what `package-lock.json` records. The lockfile was created on Windows, but it includes the Linux builds of Vite's native packages (`@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`). Without a linter (decision 13), the typecheck and component tests are the frontend's quality gate, so they run on every push and pull request.

## 17. Production runs on one database; Solid Cache, Queue and Cable removed

- **Decision:** Removed the `solid_cache`, `solid_queue` and `solid_cable` gems and their files:
  - `config/cache.yml`, `config/queue.yml`, `config/recurring.yml`;
  - `db/cache_schema.rb`, `db/queue_schema.rb`, `db/cable_schema.rb`;
  - `bin/jobs`, and the Solid Queue plugin line in `config/puma.rb`.

  Production now uses Rails' in-process defaults: `memory_store` for the cache, the `async` job adapter, and the `async` Action Cable adapter. `database.yml` has a single production database, with `DATABASE_URL` supplying the connection details.
- **Why:** The generated config expects four production databases. Render's Free plan gives one PostgreSQL database, and v1 uses no caching, background jobs or websockets. Keeping the gems would have meant loading three unused schemas into the main database. Render's own Rails 8 guide also leaves these out (`--skip-solid`).
- **Consequence:** The login rate limit (from the generated authentication) counts attempts in the cache. In memory, the count is per process and resets on restart. That's correct as long as the app runs as a single Puma process. `config/puma.rb` guarantees that with `workers 0` (decision 20). Puma would otherwise take its worker count from `WEB_CONCURRENCY`, which Render sets to 1. If the app ever needs several processes or background jobs, Solid Cache and Solid Queue can be added back, sharing the one database.

## 18. HTTPS enforced in production

- **Decision:** In `config/environments/production.rb`, turned on the generated `config.assume_ssl = true`, `config.force_ssl = true`, and the `ssl_options` setting that excludes `/up` from the HTTPS redirect.
- **Why:** Render terminates TLS at its load balancer and forwards requests to the app over plain HTTP. It also redirects HTTP to HTTPS itself, before the request reaches the app. `assume_ssl` makes Rails treat those forwarded requests as HTTPS: generated URLs and redirects use `https://`, and Rails doesn't redirect requests that are already secure. `force_ssl` adds `Strict-Transport-Security` and marks every cookie `secure`, including the login cookie (`session_id`) and the Rails session cookie.
- **The `/up` exclusion:** has little effect while `assume_ssl` is on, but it's kept as generated so health checks can never be redirected.
- **Verified locally in production mode:**
  - `/up` returns 200;
  - responses include `Strict-Transport-Security`;
  - both cookies have `secure; httponly; samesite=lax`;
  - logging in redirects to `https://…/`.

## 19. Render build script runs migrations and seeds (Free plan)

- **Decision:** Render's build command is `bin/render-build.sh`. It runs, in order:
  1. prints the Node and npm versions;
  2. `bundle install`;
  3. `npm ci --include=dev`;
  4. `assets:precompile` with `VITE_RUBY_SKIP_ASSETS_PRECOMPILE_INSTALL=true`, then `assets:clean`;
  5. `db:migrate`;
  6. `db:seed`.

  The start command is `bin/rails server`.
- **Why:**
  - **Migrations and seeds in the build:** Render's pre-deploy command needs a paid plan, and its Rails 8 guide says that on the Free plan migrations can live in the build script.
  - **Seeding every deploy:** the seed is safe to repeat (decision 9). Each deploy makes sure the HR login exists, with the password from `HR_PASSWORD`.
  - **Node version printed first:** confirms in the build log that Render honoured `.node-version`.
  - **Explicit `npm ci`:** vite_ruby's own install step also runs `npm ci` (checked in `vite_ruby` 3.11.1, `lib/tasks/vite.rake`), but it ignores npm's exit status. The explicit step, under `set -o errexit`, stops the build at the real failure instead of a confusing Vite error later. The environment variable then skips vite_ruby's duplicate install. `--include=dev` keeps Vite and its plugins installed even if `NODE_ENV=production` is set.
- **Line endings:** `.gitattributes` sets `*.sh text eol=lf`, and the script is committed executable (`100755`), because this repo is developed on Windows with `core.autocrlf=true`.
- **If the service moves to a paid plan:** move `db:migrate` and `db:seed` into the pre-deploy command (`bin/rails db:migrate db:seed`), so a failed migration doesn't leave a half-built deploy.

## 20. Puma always runs in single mode

- **Decision:** `config/puma.rb` sets `workers 0`. A spec (`spec/config/puma_spec.rb`) checks that Puma stays in single mode when `WEB_CONCURRENCY` is set and when it isn't.
- **Why:** Puma's `workers` setting defaults to the `WEB_CONCURRENCY` environment variable (Puma 8.0.2, `lib/puma/dsl.rb`: "The default is the value of the environment variable `WEB_CONCURRENCY` if set, otherwise 0"). An explicit `workers` line in the config file takes precedence over that default. Render sets `WEB_CONCURRENCY=1` by default, so the first deploy started Puma in cluster mode with one worker, which also logged a warning. Puma's deployment guide recommends single mode when only one CPU core is available, and says clusters need "minimum 2, otherwise use single mode!". Single mode is also what the in-memory cache and login rate limit need (decision 17).
- **Correction:** decision 17 originally said the generated `puma.rb` doesn't read `WEB_CONCURRENCY`. That was wrong: Puma reads it, even though `puma.rb` doesn't mention it. Decision 17 now points here.

## 21. Country catalogue in code, with ECB reference rates

- **Decision:** `Country` (`app/models/country.rb`) is a plain Ruby value class, not a database table. It lists the 8 supported countries with one currency each:

  | Code | Country | Currency |
  |---|---|---|
  | AU | Australia | AUD |
  | CA | Canada | CAD |
  | DE | Germany | EUR |
  | FR | France | EUR |
  | GB | United Kingdom | GBP |
  | IN | India | INR |
  | JP | Japan | JPY |
  | US | United States | USD |

  It provides:
  - `Country.all`, `Country.find(code)` and `Country.codes`;
  - `country.usd_rate`: units of local currency per 1 USD, the usual way rates are quoted;
  - `country.to_usd(amount)`: converts to USD, rounded to cents.
- **Source of the rates:** the European Central Bank's euro foreign exchange reference rates for **2026-10-22**, taken from the official daily feed (`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`) on that date. The ECB publishes units of each currency per 1 EUR:

  | Currency | Per 1 EUR | Per 1 USD (derived) |
  |---|---|---|
  | USD | 1.1205 | 1 |
  | EUR | 1 | 0.8925 |
  | GBP | 0.83770 | 0.7476 |
  | INR | 106.2490 | 94.8228 |
  | JPY | 175.97 | 157.0460 |
  | CAD | 1.5725 | 1.4034 |
  | AUD | 1.5980 | 1.4261 |

- **How the rates are stored:** the code keeps the ECB numbers exactly as published (`EUR_REFERENCE_RATES`), so they can be checked against the source, and derives the per-USD rate from them. `to_usd` multiplies before dividing, so no intermediate rate is rounded, and only the final result is rounded to cents. All arithmetic uses `BigDecimal`. `to_usd` refuses `Float` amounts.
- **Why:**
  - **In code, not a table:** the list and rates change rarely, there is no UI to edit them (out of scope for v1), and a mistake fails the specs straight away.
  - **One official source on one date:** keeps the rates consistent with each other, and lets the UI show a single "rates as of" date.
  - **Approximate by design:** fixed rates are good enough for comparing pay across countries, which the requirements describe as approximate. Within-country figures always stay in local currency.
- **Updating the rates:** replace `EUR_REFERENCE_RATES`, `RATES_AS_OF` and the expected values in `spec/models/country_spec.rb` together, from a single ECB publication.

## 22. Employee model: validations, normalisation and database constraints

- **Decision:** `employees` table and `Employee` model:
  - **Text fields:** `full_name`, `job_title` and `department` are required free text. They're stored with whitespace collapsed (`squish`), so "Engineer " and "Engineer" filter and group as one value.
  - **`country`:** a two-letter code that must be one of the `Country` codes (decision 21), stored uppercase.
  - **`currency`:** must equal the country's currency (for example "must be INR for India"), stored uppercase.
  - **`salary`:** `decimal(15,2)`, greater than 0 and below 10^13 (what the column can hold). Never a float.
  - **`employment_type`:** one of `full_time`, `part_time`, `contractor`. It's a Rails enum stored as a string, with `validate: true` so a bad value gives a validation error rather than an exception.
  - **`hire_date`:** required, and can't be in the future.
- **Database constraints** back up the model:
  - every column is `NOT NULL`;
  - `country` and `currency` have length limits;
  - check constraints `salary_positive` and `employment_type_allowed` stop bad rows written by `insert_all` (as the seed will be in step 15) or by code that skips validations.
- **Indexes:** `(country, job_title)`, `(country, department)`, `department` and `job_title`. They match the list filters and the insight `GROUP BY`s. There's no separate `country` index, because both composite indexes start with `country` and PostgreSQL can use them for country-only queries. Name search will use `ILIKE` without an index (fine at 10,000 rows; a `pg_trgm` index can be added later if needed).
- **Currency kept as a column even though the country determines it:** the requirements list currency as an employee field, and storing it makes each row self-describing for the API and for any future change of a country's currency. The validation stops it drifting from the country.
- **Testing:** `spec/support/time_helpers.rb` makes Rails' `travel_to` available, so the hire-date specs use a fixed date rather than the real clock.

## 23. Employee list query: search, filters, sorting and pagination in SQL

- **Decision:** `Employees::ListQuery` (`app/queries/employees/list_query.rb`) returns one page of employees, plus `total_count`, `page`, `per_page` and `total_pages`. It runs two SQL queries: the page itself (`LIMIT`/`OFFSET`) and a `COUNT`.
  - **Search:** case-insensitive substring match on `full_name` with `ILIKE`. `%` and `_` in the search text are escaped, so they match literally.
  - **Filters:** exact match on `country`, `department` and `job_title`. Blank values are ignored, so the API can pass empty form fields straight through.
  - **Sorting:** only `full_name`, `salary` or `hire_date`, `asc` or `desc`. Anything else falls back to name ascending, so a bad value can't change the SQL or cause an error. `employees.id` is always the last sort key, so rows with equal values keep a stable order across pages.
  - **Paging:** 25 rows by default, at most 100. A missing, zero, negative or non-numeric page or page size falls back to the default.
- **Why:**
  - **Hand-written paging:** agreed instead of a gem (`pagy`). It's a few lines, and fully covered by specs.
  - **Names sorted by `LOWER(full_name)`:** the result then doesn't depend on the database's collation, which differs between the Windows development database and Linux CI and production.
  - **Two queries:** at 10,000 rows, `OFFSET` paging and a separate `COUNT` are fast enough, so keyset pagination isn't worth the extra complexity.
- **Known limitation:** sorting by salary across all countries mixes currencies: the numbers are compared as they are, so 100,000 INR (about 1,050 USD) sorts above 2,000 USD. Sorting by salary only makes sense once the list is filtered to one country. The list UI (step 17) should make that clear, for example by showing the currency next to every salary.

## 24. JSON API under /api, with 401 instead of a login redirect

- **Decision:** API endpoints live under `/api` (`namespace :api, defaults: { format: :json }`). Their controllers inherit from `Api::BaseController`, which uses the same session-cookie login as the rest of the app but overrides `request_authentication`: a request that isn't logged in gets `401` with `{"error": "You need to sign in."}`. Every controller outside `/api` keeps the generated behaviour and redirects to the login page, even when the request asks for JSON. Request specs cover both.
- **First endpoint:** `GET /api/employees`. The controller passes only the permitted query parameters (`Employees::ListQuery::PARAMS`) to `Employees::ListQuery` and returns:
  - `employees`: built by `EmployeeSerializer`;
  - `meta`: `page`, `per_page`, `total_count` and `total_pages`.
- **JSON shape of an employee:** `id`, `full_name`, `job_title`, `department`, `country`, `country_name`, `currency`, `salary`, `employment_type` and `hire_date` (ISO 8601).
- **Salaries are strings with exactly two decimals** (`"85000.50"`). JSON numbers are read as floats in JavaScript and can't hold every `decimal(15,2)` value exactly, so the frontend must treat salaries as strings and never do arithmetic on them. The formatting avoids `Float` too, and rounds half up.
- **Why:**
  - **Scoped by controller:** the 401 rule follows the URL, not the `Accept` header, so a normal page can never answer a browser with bare JSON.
  - **No return URL saved:** the API version doesn't store a URL to return to after login, so signing in never lands the user on a raw JSON response.
  - **CSRF unchanged:** protection stays on for the API. Requests that change data (step 9) must send the `X-CSRF-Token` header, using `app/frontend/lib/csrf.ts`.

## 25. Employee create, read, update and delete over the API

- **Decision:** `GET`, `POST`, `PATCH` and `DELETE` on `/api/employees(/:id)`.
  - **Request body:** must name the resource, as in `{"employee": {...}}`. Only the eight employee fields are accepted (`params.expect`); anything else, such as `id` or `created_at`, is ignored. `wrap_parameters false` in `Api::BaseController` turns off Rails' automatic wrapping, so a body without the `employee` key gets 400 instead of being guessed at.
  - **Success:** `show` returns 200, `create` returns 201, `update` returns 200, all with `{"employee": {...}}`. `destroy` returns 204. `PATCH` changes only the fields it's given. A salary edit overwrites the current salary with no history, as v1's scope says.
  - **Errors, always as JSON:**
    - validation errors: 422 with `{"errors": {"field": ["message", ...]}}`;
    - unknown id: 404 with `{"error": "Not found."}`;
    - missing `employee` key: 400;
    - missing or invalid CSRF token: 403 with `{"error": "Invalid or missing CSRF token."}`;
    - not logged in: 401 (decision 24).
- **Why:**
  - **Errors keyed by field:** the React form (step 18) can show each message next to its field.
  - **403 for CSRF, not Rails' default 422:** keeps 422 meaning "fix the form", so the frontend can tell a validation problem from a session or token problem.
  - **CSRF specs turn protection on:** the test environment switches it off. The specs check both that a write without the `X-CSRF-Token` header is rejected and that the token from the page's meta tag is accepted.
- **Salaries in requests:** the frontend should send salaries as strings (`"85000.50"`), the same as the API returns them, so they're never rounded through a JavaScript number.

## 26. Filter options endpoint

- **Decision:** `GET /api/employees/filters` (`Api::EmployeeFiltersController`, using `Employees::FilterOptionsQuery`) returns:
  - **`countries`:** every supported country from the catalogue (`code`, `name`, `currency`), sorted by name;
  - **`departments` and `job_titles`:** each value that exists in the data, once, sorted ignoring case;
  - **`employment_types`:** the enum values.
- **Why:**
  - **Countries from the catalogue, not the data:** the same response serves the list filters and the employee form (step 18), and the form must offer every supported country, including ones with no employees yet. It also gives the form each country's currency, so the currency can be filled in automatically.
  - **Departments and job titles from the data:** they're free text (decision 22), so the data is the only source. They're computed in SQL with `GROUP BY`, sorted by `LOWER(...)` so the order doesn't depend on the database's collation. Normalising whitespace on save (decision 22) keeps near-duplicates out of these lists.
  - **Employment types from the model:** `Employee.employment_types.keys`, so the frontend never keeps its own copy of the allowed values.
  - **Separate controller:** keeps `EmployeesController` to the standard actions. The route is a collection route, so Rails matches `/api/employees/filters` before `/api/employees/:id`. A spec checks that.

## 27. Salary insights as SQL aggregate queries

- **Decision:** Four query objects in `app/queries/salary_insights/`, each returning simple read-only rows:
  - **`ByCountry`:** headcount, min, max and average salary per country, in local currency (`GROUP BY country, currency`).
  - **`ByJobTitle.call(country:)`:** headcount, average, min and max salary per job title within one country (`WHERE country = ? GROUP BY job_title`). It's sorted by average salary, highest first, then by title ignoring case. An unsupported country raises `ArgumentError`.
  - **`Headcount`:** employees per country and department (`GROUP BY country, department`).
  - **`CrossCountryUsd`:** `ByCountry`'s figures converted to USD with `Country#to_usd`, plus the rate used, sorted by average USD salary, highest first.
- **Why:**
  - **Totals in the database:** every count, minimum, maximum and average is computed by PostgreSQL. Ruby only labels and orders the handful of result rows (at most 8 countries, or one country's job titles). The specs check this by counting how many Active Record objects are created while each query runs, which must be zero (`spec/support/query_helpers.rb`). A throwaway check confirmed the counter does register records when they are loaded.
  - **Averages left unrounded:** they come back as PostgreSQL's exact `numeric`, so a USD conversion starts from the true average. The spec shows the difference: the UK average of 60,000.333… GBP converts to 80,255.91 USD, while converting the pre-rounded 60,000.33 would give 80,255.90. Rounding to cents happens only when values are sent to the frontend (step 14).
  - **Converting the averages:** converting each country's average gives the same result as converting every salary first, because one fixed rate applies to the whole country. So the USD figures need no extra SQL and load no employee data.
  - **Never mixing currencies:** within-country figures stay in local currency. Only `CrossCountryUsd` puts countries side by side, and only in USD, as `requirements.md` specifies.
- **Sorting by country name in Ruby:** country names live in the `Country` catalogue, not the database, so `ByCountry` and `Headcount` sort their few result rows by name in Ruby. `Headcount` keeps SQL's department order within each country.

## 28. Salary insights API

- **Decision:** Four read-only endpoints in `Api::InsightsController`, each running one `SalaryInsights` query (decision 27) and shaped by `SalaryInsightsSerializer`:
  - **`GET /api/insights/by_country`:** `{ countries: [{ country, country_name, currency, headcount, min_salary, max_salary, average_salary }] }`.
  - **`GET /api/insights/by_job_title?country=GB`:** `{ country, country_name, currency, job_titles: [{ job_title, headcount, average_salary, min_salary, max_salary }] }`. A missing `country` returns 400 (`params.expect`). An unsupported country returns 400 with `{"error": "Unsupported country: XX"}`, rescued from the specific `SalaryInsights::ByJobTitle::UnsupportedCountry` error rather than every `ArgumentError`. A supported country with no employees returns an empty list.
  - **`GET /api/insights/headcount`:** `{ rows: [{ country, country_name, department, headcount }] }`. Per-country totals are already in `by_country`.
  - **`GET /api/insights/usd_comparison`:** `{ rates_as_of, rates_source, countries: [{ country, country_name, currency, usd_rate, headcount, min_usd, max_usd, average_usd }] }`.

  All four require login and return 401 JSON otherwise (decision 24).
- **Number formatting:** `DecimalFormat` (`app/serializers/decimal_format.rb`) now formats every decimal in the API:
  - `money` gives two decimal places, rounded half up;
  - `fixed(places: 4)` is used for `usd_rate` (for example `"94.8228"`, meaning 1 USD = 94.8228 INR);
  - both refuse `Float`.

  It replaces the `EmployeeSerializer.money` method from decision 24, so salaries, averages and USD figures are all formatted the same way. Exact averages from PostgreSQL are rounded only here, at the edge of the API.
- **Why:** each endpoint maps to one of the questions in `requirements.md`, so the insight pages (step 19) need one request per view. The USD comparison response carries the rate date and source, so the UI can label the figures "approximate, rates as of 22 Oct 2026 (ECB)" without hard-coding them.

## 29. Seed of 10,000 demo employees: deterministic, and only into an empty table

- **Decision:** `db/seeds.rb` calls `Seeds::Employees.call(count: 10_000)` after the HR user seed.
  - **`Seeds::EmployeeGenerator`:** builds the employees' attributes with `Random.new(42)` from fixed lists in `Seeds::EmployeeData`:
    - names per country;
    - 7 departments with 22 job titles, each with a salary multiplier;
    - a reference salary per country in local currency;
    - country weights (US 30%, IN 25%, GB 12%, DE 10%, FR 7%, CA 7%, AU 5%, JP 4%);
    - employment-type weights (80% full-time, 12% part-time, 8% contractor).

    Salaries are worked out with integers and `BigDecimal` only, rounded to whole units (to the nearest 10,000 for JPY), and always in the country's currency. Hire dates fall between 2010-01-01 and a fixed 2026-09-30, never `Date.current`, so the output never changes over time. The generator has no database access and no clock.
  - **`Seeds::Employees`:** inserts the rows with `insert_all!` in batches of 1,000, inside one transaction, **only when the `employees` table is empty**. Otherwise it inserts nothing and reports how many employees already exist.
- **Why:**
  - **Safe on every deploy:** the seed runs on every Render build (decision 19). Checking for an empty table means it can never duplicate employees, and it never deletes or edits them.
  - **One transaction:** a failed run leaves no rows behind, so the next run seeds cleanly instead of finding a half-filled table and skipping it. A spec forces a failure in the second batch and checks that nothing remains.
  - **`insert_all!`:** fast, and Rails still fills in `created_at` and `updated_at`. It skips model validations, so the generator's output is checked against them in a spec (500 rows), and the database's check constraints (decision 22) catch any bad row. The full 10,000 seeded locally all pass validation.
  - **Fixed lists in the repo, not Faker:** this keeps the output stable across gem upgrades, as agreed. The values are illustrative, not market data.
- **Measured:** seeding 10,000 employees locally took 13.4 s, including about 8 s of Rails start-up. A second run printed "Employees already present (10000); skipped."
- **Known limitation:** the seed can't tell "never seeded" from "every employee was deleted". If the HR Manager ever deletes **all** employees, the next deploy will add the 10,000 demo employees again. Accepted for v1: it's unlikely in a demo, and preventing it needs a permanent "seeded" marker (for example a `seed_runs` table), which isn't worth a migration now.

## 30. Client-side routing with React Router, and a small fetch-based API client

- **Decision:**
  - **React Router 8.5** (`react-router`), in declarative mode: `BrowserRouter` in the entry file, `<Routes>` in `App`. Its requirements (React ≥ 19.2.7, Node ≥ 22.22) match the project. The plan said v7; v8 is the current release.
  - **Routes:** `/` redirects to `/employees`. There are `/employees` and `/insights` pages, and a "Page not found" page for anything else. `AppLayout` (Mantine `AppShell`) provides the header with sign-out, and a navbar whose links are marked `aria-current="page"` for the current page. On small screens the navbar collapses behind a burger button.
  - **Rails serves the same app** for `employees(/*rest)` and `insights(/*rest)` (`home#index`), so refreshing or bookmarking a page works. These routes are explicit rather than a catch-all, so other unknown URLs still return 404, and `/api`, `/session` and `/up` are untouched. Logged-out requests for these pages still redirect to login.
  - **`app/frontend/lib/api.ts`:** `apiGet` (query string built without empty values, optional `AbortSignal`) and `apiSend` (JSON body with the `X-CSRF-Token` header).
    - 401 sends the browser to `/session/new`;
    - 422 throws a `ValidationError` holding the field errors;
    - any other failure throws an `ApiError` with the server's message;
    - 204 returns nothing.
- **Why:**
  - **No data-fetching library** (such as TanStack Query): v1 has a handful of read and write calls. A thin wrapper is easy to read and test, and adds no dependency.
  - **Redirect on 401:** a 401 can only mean the session has ended, and logging in again returns the user to the app.
  - **`ValidationError` separate from `ApiError`:** the form (step 18) can show messages next to fields, while other errors show as a general alert.
- **Testing:** `test/render.tsx` wraps components in a `MemoryRouter` that starts at a chosen URL. The specs check navigation, the `/` redirect, unknown pages, the client's headers, its error types, and the 401 redirect (with `navigation.toLogin` replaced, since jsdom can't navigate).

## 31. Employee list page

- **Decision:** `/employees` (`pages/EmployeesPage.tsx`) is built from standard Mantine components:
  - a `TextInput` for name search, debounced 300 ms with `useDebouncedValue`;
  - three searchable, clearable `Select`s for country (by name), department and job title, filled from `/api/employees/filters`;
  - a `Table` (with `Table.ScrollContainer` for narrow screens) with Name, Salary and Hire date as sortable headers;
  - a `Pagination` with "Showing 26–50 of 3,050";
  - a `LoadingOverlay`, an empty-state message and an `Alert` for errors.
- **State in the URL:** search, filters, sort, direction and page are query parameters with the same names the API uses, so they pass straight through. Back and forward, refresh and shared links all work.
  - Changing the search, a filter or the sort drops `page`, returning to page 1.
  - Search updates use `replace`, so typing doesn't fill the browser history.
  - A URL change from elsewhere (for example the back button) updates the search box.
- **Sorting:** headers are buttons with ▲ and ▼ and `aria-sort`. Clicking the active column flips the direction; clicking a new column sorts ascending. With no `sort` parameter the page shows name ascending, which is the API's default. No icon library was added.
- **Salaries:** shown with the currency code, as agreed ("GBP 85,000.50", "JPY 7,000,000"). `formatMoney` passes the API's decimal **string** to `Intl.NumberFormat`, which formats strings exactly, so salaries are never rounded through a JavaScript number. It also uses each currency's usual number of decimals, so JPY has none. When the list is sorted by salary without a country filter, a note explains that salaries are in each country's currency and suggests filtering by country (decision 23).
- **Data loading:** `useApiGet` re-fetches when the URL changes and keeps the previous rows visible under the overlay while loading. It also cancels the previous request, so a slow, out-of-date response can't overwrite a newer one.
- **Testing:** `test/apiMock.ts` stubs `fetch` for the employee endpoints and records each list request's query, so tests check what the page actually asked the API for. The search test uses fake timers to show that no request is sent while typing and exactly one is sent after the pause. The suite was run three times in a row to check that it isn't flaky.

## 32. Add, edit and delete employee pages

- **Decision:** `/employees/new` and `/employees/:id/edit` share `components/EmployeeForm.tsx`. The list has an "Add employee" button and an "Edit" link on every row (labelled "Edit <name>" for screen readers).
  - **Department and job title:** Mantine `Autocomplete`, which suggests the existing values from `/api/employees/filters` but accepts anything typed. HR picks "Sales" from the list instead of typing a variant, and can still add a new department. Combined with whitespace normalisation on the server (decision 22), this keeps filters and insights clean.
  - **Country:** a `Select`. Choosing one fills in **Currency**, which is read-only and labelled "Set by the country", from the same filter options. The salary label shows the currency ("Salary (INR)").
  - **Salary:** a text field, sent as a string, never a number. Commas and spaces are removed before sending, so "2,400,000.50" is accepted.
  - **Hire date:** the browser's native date input.
  - **Layout:** each field is label, then input, then help text and error (`inputWrapperOrder`). With Mantine's default (help text above the input), a field with help text sat lower than its neighbour in the same row, so the two-column rows didn't line up. A test checks that help text comes after the input.
  - **Validation:** done by the server. The form turns off the browser's own checks (`noValidate`) and shows the API's 422 messages under each field (`aria-invalid` set). Any other failure, such as an expired CSRF token, appears as an alert above the form.
  - **Delete:** on the edit page, behind a Mantine `Modal`: "Delete <name>? This can't be undone." Cancel sends nothing.
  - **After saving or deleting:** the user returns to the list **with the same filters, sort and page** they came from (passed in navigation state), and a green "<name> was added / updated / deleted." message.
- **Why no `@mantine/form` or `@mantine/dates`:** both are separate packages. The form has eight fields and the server owns validation, so plain React state is enough, and the native date input covers dates. This also keeps the dependency list short, as CLAUDE.md asks.
- **Testing:** Vitest drives the real `App` through the add, edit and delete flows. The tests check:
  - the exact JSON body sent, including the CSRF header, the salary with separators removed, and the currency set from the country;
  - field-level 422 errors;
  - loading the employee into the form, and the "not found" case;
  - cancelling and confirming delete;
  - returning to the filtered list.

  The shared fetch stub (`test/apiMock.ts`) now records every request with its method, body and headers.

## 33. Insights pages

- **Decision:** `/insights` is a page with Mantine `Tabs`. Each view has its own URL, so a view can be bookmarked and the back button moves between views. `/insights` opens on By country, and unknown `/insights/...` URLs show "Page not found".
  - **By country** (`/insights/by-country`): employees, minimum, average and maximum salary per country, each in that country's currency. A note points to the USD comparison for comparing countries.
  - **By job title** (`/insights/by-job-title?country=IN`): a country picker, then employees, average, minimum and maximum per job title, highest average first. Nothing is loaded until a country is chosen. The country is kept in the URL.
  - **Headcount** (`/insights/headcount`): a grid with countries as rows and departments as columns, plus a total column and an "All countries" row. Empty cells show 0.
  - **USD comparison** (`/insights/usd-comparison`): employees, the rate used ("1 USD = 94.8228 INR"), and minimum, average and maximum in USD, highest average first. A note above the table says the figures are approximate and names the rate source and date from the API ("…reference rates of 22 October 2026").
- **Shared behaviour:** all four views use the same loading, error and "No employees yet." states (`InsightStatus`). Money is shown with its currency code, using `formatMoney` (decision 31).
- **Why:**
  - **The headcount grid adds up in the browser:** the API returns counts already calculated in SQL. The page only adds up at most a few dozen of those for the totals; no employee rows are ever loaded. A grid answers "how many people in each country and department" at a glance, which a long list of pairs doesn't.
  - **The USD view shows the rate and date beside the figures:** the conversion is approximate and fixed (decision 21), so it shouldn't look like exact payroll data.
  - **Tables, not charts:** as agreed for v1. The step 20 stretch adds one chart (average salary by job title within a country).
- **`useApiGet(null)`** now skips loading, which is used while no country is chosen. **`formatLongDate`** formats the rates date as UTC, so the day can't shift with the browser's time zone.

## 34. Median salary and the average-salary-by-job-title chart (stretch)

- **Median, computed in SQL:** `SalaryInsights::Sql::MEDIAN_SALARY` is used by `ByCountry` and `ByJobTitle`. `CrossCountryUsd` converts the median to USD like the other figures. The API adds `median_salary` (and `median_usd`), and the three salary tables gain a Median column.
  - **No floats:** PostgreSQL's `PERCENTILE_CONT` returns `double precision`, a float, which breaks the no-floats rule. The query instead averages `PERCENTILE_DISC(0.5)` taken in ascending and in descending order. Both pick real `numeric` values from the column, so the result is exact: the middle salary for an odd count, and the mean of the two middle salaries for an even count. A spec uses 9,999,999,999,999.98 and .99, whose exact median is …985; a float gives …984.
  - **Speed:** on the 10,000 seeded employees the by-country query takes about 3 ms and one country's job titles about 10 ms. The seeded US median (88,900 USD) is below its average (96,122 USD), which is why the median is worth showing.
- **Chart:** the By job title view shows a horizontal Mantine `BarChart` of average salary per job title, highest first, in the country's currency, above the table. It's a `<figure>` with a caption, for example "Average salary by job title in India (INR)".
  - **Numbers only for drawing:** the bars need JavaScript numbers, so `jobTitleChartData` converts the API's strings with `Number(...)`. That's fine for drawing a bar. The exact values stay in the table, and tooltips are formatted with the currency code.
- **Packages:** `@mantine/charts` 9.7.3, `recharts` 3.10.1, and `react-is` 19.3.1 (a peer dependency of recharts).
  - **Compatibility:** checked from the packages and Mantine's docs. `@mantine/charts` 9.7.3 requires `@mantine/core` and `@mantine/hooks` at exactly 9.7.3, React ^19.2.0, and recharts ≥3.2.1. Recharts accepts React 16 to 19.
  - **Checks after installing:** one copy of React, and `npm audit` 0 vulnerabilities.
  - **Styles:** `@mantine/charts/styles.css` is imported after the core styles, as the docs require.
- **Cost:** the production JavaScript bundle grew from 516 kB to 923 kB (149 kB to 274 kB gzipped), mostly recharts. A follow-up for step 21 is to load the chart with `React.lazy`, so only the By job title view downloads it.
- **Lessons:**
  - **File names that differ only in case:** `jobTitleChart.ts` and `JobTitleChart.tsx` in the same folder clashed on Windows, where file names are case-insensitive, so the component import resolved to the wrong file. Linux would have behaved differently. The helper is now `jobTitleChartData.ts`.
  - **Slow form tests:** they now use `userEvent.setup({ delay: null })`, which types without pausing between keystrokes. On a slow, memory-starved machine the eight-field form tests otherwise went past Vitest's 5-second limit.

## 35. The job title chart is lazy-loaded

- **Decision:** `ByJobTitleInsight` loads `JobTitleChart` with `React.lazy`, inside a `Suspense` with a small loader. `JobTitleChart.tsx` imports `@mantine/charts/styles.css` itself, so the chart's CSS is split out with it. The core styles are in the main bundle, so they still load first, as Mantine requires.
- **Why:** recharts was most of the bundle (decision 34), yet only one view uses it. Now the employee list, the forms and the other insights load without it.
- **Measured (`bin/vite build`, before → after):**

  | File | Before | After |
  |---|---|---|
  | Main JS (`application`) | 922.71 kB (274.02 kB gzipped) | **518.06 kB (158.31 kB gzipped)** |
  | Chart JS (`JobTitleChart`), By job title view only | none | 406.41 kB (116.60 kB gzipped) |
  | Main CSS | 262.31 kB (37.88 kB gzipped) | 248.44 kB (35.91 kB gzipped) |
  | Chart CSS, By job title view only | none | 13.86 kB (2.49 kB gzipped) |

  The JavaScript every page loads shrank by 44% (42% gzipped). The build confirms recharts appears only in the chart file, and Vite's manifest lists the chart's JS and CSS. The main bundle is still just over Vite's 500 kB warning threshold, mostly Mantine's core components; splitting it further isn't worth the complexity for v1.
- **Testing:** the insights test now waits for the chart (`findByRole("figure", …)`), because it appears after the table has loaded.

## 36. Sort icons always visible on sortable headers

Updates the sorting bullet of decision 31.

- **Decision:** Name, Salary and Hire date always show a sort icon. A faint **↕** means "not sorted by this column, click to sort"; a blue **▲** or **▼** shows the current sort and its direction. Hovering a header shows "Sort by …". The icon is decorative (`aria-hidden`), so screen readers still hear just the column name, plus the order from `aria-sort`. Columns that can't be sorted have no icon.
- **Why:** in user testing, people didn't realise the headers were clickable, because only the column already being sorted showed an arrow.
- **Icons:** text arrows rather than an icon package such as `@tabler/icons-react`, to avoid a dependency for three symbols.
- **Test fix found along the way:** the insights test waits up to 5 s for the lazy-loaded chart (decision 35). On a busy machine, Vitest can take longer than Testing Library's default 1 s to transform recharts the first time it's loaded, which made the test fail now and then.
