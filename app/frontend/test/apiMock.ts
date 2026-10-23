import { vi } from "vitest";
import type { Employee, EmployeeListResponse, FilterOptions } from "../types";

export const filterOptions: FilterOptions = {
  countries: [
    { code: "IN", name: "India", currency: "INR" },
    { code: "GB", name: "United Kingdom", currency: "GBP" },
  ],
  departments: ["Engineering", "People"],
  job_titles: ["Engineer", "Recruiter"],
  employment_types: ["full_time", "part_time", "contractor"],
};

export function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    full_name: "Ada Lovelace",
    job_title: "Engineer",
    department: "Engineering",
    country: "GB",
    country_name: "United Kingdom",
    currency: "GBP",
    salary: "85000.50",
    employment_type: "full_time",
    hire_date: "2023-04-01",
    ...overrides,
  };
}

export function listResponse(employees: Employee[], meta: Partial<EmployeeListResponse["meta"]> = {}): EmployeeListResponse {
  return {
    employees,
    meta: { page: 1, per_page: 25, total_count: employees.length, total_pages: employees.length ? 1 : 0, ...meta },
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

type Handlers = {
  list?: (url: URL) => { status?: number; body: unknown };
};

// Stubs fetch for the employee API. Returns the mock so tests can inspect the
// requested URLs with `employeeListUrls`.
export function stubApi({ list = () => ({ body: listResponse([]) }) }: Handlers = {}) {
  const fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, "http://localhost");
    if (url.pathname === "/api/employees/filters") return json(200, filterOptions);
    if (url.pathname === "/api/employees") {
      const { status = 200, body } = list(url);
      return json(status, body);
    }
    return json(404, { error: "Not found." });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// The query parameters of each /api/employees list request, in order.
export function employeeListRequests(fetchMock: ReturnType<typeof stubApi>): URLSearchParams[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(input, "http://localhost"))
    .filter((url) => url.pathname === "/api/employees")
    .map((url) => url.searchParams);
}
