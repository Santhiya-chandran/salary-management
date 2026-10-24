# Salary Management – Requirements

## Goal
ACME's HR team manages salary data for 10,000 employees across multiple countries in Excel, which is slow and error-prone. This tool lets the HR Manager manage employee salary data in a web app and answer questions about how the organisation pays people.

## User Persona
**HR Manager**: the single primary user. Needs to find, add, and update employee records quickly, and to understand pay across countries, job titles, and departments without building spreadsheets.

## Scope & Features (v1)

### 1. Authentication
- HR Manager logs in with email and password (session-based).
- All pages and APIs require login.

### 2. Employee Management
- Employee fields: full name, job title, department, country, salary, currency, employment type, hire date.
- List view with **server-side pagination**, **search by name**, **filters** (country, department, job title), and **sorting** (name, salary, hire date).
- Add, edit, and delete an employee, with validation:
  - every field is required;
  - salary must be greater than 0;
  - the currency must be the employee's country's currency (it's filled in automatically when the country is chosen);
  - the hire date can't be in the future.
- Edit updates the employee's **current** salary.
- Department and job title suggest existing values while still allowing new ones, so the same department isn't entered under different spellings.
- Deleting asks for confirmation.

### 3. Salary Insights
Questions the HR Manager can answer:
- What are the minimum, maximum, and average salaries in a given country?
- What is the average salary for a job title within a country?
- How many employees are in each country and department?
- How do salaries compare across countries? (Shown in approximate USD, with the rate source and date.)
- What is the median salary for a country or job title? *(Planned as a stretch goal; built in v1.)*

The average salary by job title within a country is also shown as a bar chart. *(Planned as a stretch goal; built in v1.)*

### 4. Data
- Seed script that creates 10,000 realistic, deterministic employees across multiple countries.
- Seed script also creates one HR Manager login for demo use.
- The seed only adds employees to an empty table, so it can run on every deploy without duplicating or changing data.
- Supported countries, each with one currency: Australia (AUD), Canada (CAD), France (EUR), Germany (EUR), India (INR), Japan (JPY), United Kingdom (GBP), United States (USD).
- USD conversion uses the European Central Bank's euro reference rates of 22 October 2026, kept in the app.

## Key Decisions
- **Currency: local currency as the source of truth, with a USD view for cross-country comparison.**
  - Salaries are stored, edited and shown in each country's local currency (each country has one currency), because that is what employees are actually paid.
  - Within-country insights use local currency, so they are exact.
  - Cross-country comparisons show a derived, approximate USD value using a fixed exchange-rate table kept in the app, with a "rates as of" date shown in the UI. Fixed rates keep results deterministic and testable.
  - USD values are never stored on the employee record.
- **Aggregations run in the database** (SQL `GROUP BY` with indexes), not in application code, so insights stay fast at 10,000+ rows.
- **Server-side pagination and filtering**, so the UI never loads all 10,000 records at once.

## Deliberately Out of Scope (v1)

| Left out | Reason |
|---|---|
| Salary change history / audit trail | v1 manages current salaries only; editing a salary overwrites it. Keeps the MVP focused. Natural next phase. |
| Live or automatically updated exchange rates | Needs an external rate provider and a policy on which rates to use. Fixed rates are enough for approximate comparison in v1. |
| Editing exchange rates in the UI | Rates change rarely; updating them in code is acceptable for v1. |
| Roles & permissions (admin vs read-only) | Single HR Manager persona. Required before wider rollout. |
| Payroll, tax, payslips | A different problem from salary data management. |
| Excel/CSV import & export | High value, since HR uses Excel today, but secondary to core management and insights. First item for v2. |
| Bulk edits (e.g. a % raise for a group) | Useful for appraisal cycles. Deferred to keep v1 focused. |

## Known Limitations (v1)

See [Known limitations in the README](../README.md#known-limitations).

## Success Criteria
- HR Manager can find any employee within a few seconds using search and filters.
- Insights pages load quickly against 10,000 employees.
- Core logic (validations, insights) is covered by fast, deterministic unit tests.