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
- Add, edit, and delete an employee, with validation (required fields, salary > 0, valid currency).
- Edit updates the employee's **current** salary.

### 3. Salary Insights
Questions the HR Manager can answer:
- What are the minimum, maximum, and average salaries in a given country?
- What is the average salary for a job title within a country?
- How many employees are in each country and department?
- *(Stretch)* What is the median salary for a country or job title?

### 4. Data
- Seed script that creates 10,000 realistic, deterministic employees across multiple countries.
- Seed script also creates one HR Manager login for demo use.

## Key Decisions
- **Salaries are stored in local currency with a currency code.** Comparisons are made within a country, which avoids misleading cross-currency averages and exchange-rate assumptions.
- **Aggregations run in the database** (SQL `GROUP BY` with indexes), not in application code, so insights stay fast at 10,000+ rows.
- **Server-side pagination and filtering**, so the UI never loads all 10,000 records at once.

## Deliberately Out of Scope (v1)

| Left out | Reason |
|---|---|
| Salary change history / audit trail | Valuable, but v1 focuses on managing current salaries. Pending stakeholder confirmation. Natural next phase. |
| Currency conversion / org-wide comparisons in one currency | Needs reliable exchange-rate data and a policy decision on which rates to use. |
| Roles & permissions (admin vs read-only) | Single HR Manager persona. Required before wider rollout. |
| Payroll, tax, payslips | A different problem from salary data management. |
| Excel/CSV import & export | High value, since HR uses Excel today, but secondary to core management and insights. First item for v2. |
| Bulk edits (e.g. a % raise for a group) | Useful for appraisal cycles. Deferred to keep v1 focused. |

## Success Criteria
- HR Manager can find any employee within a few seconds using search and filters.
- Insights pages load quickly against 10,000 employees.
- Core logic (validations, insights) is covered by fast, deterministic unit tests.