import { vi } from "vitest";
import type { Employee, EmployeeListResponse, FilterOptions } from "../types";

export const filterOptions: FilterOptions = {
  countries: [
    { code: "IN", name: "India", currency: "INR" },
    { code: "GB", name: "United Kingdom", currency: "GBP" },
  ],
  departments: ["Engineering", "People", "Sales"],
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
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type Reply = { status?: number; body?: unknown };

export type RecordedRequest = { method: string; url: URL; body: unknown; headers: Record<string, string> };

type Handlers = {
  // GET /api/employees
  list?: (url: URL) => Reply;
  // Any other /api/employees/... request (show, create, update, delete).
  other?: (request: RecordedRequest) => Reply | undefined;
};

// Stubs fetch for the employee API. Returns the mock so tests can inspect the
// requests with `employeeListRequests` and `recordedRequests`.
export function stubApi({ list = () => ({ body: listResponse([]) }), other }: Handlers = {}) {
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const request = toRecordedRequest(input, init);
    const { method, url } = request;

    if (method === "GET" && url.pathname === "/api/employees/filters") return json(200, filterOptions);
    if (method === "GET" && url.pathname === "/api/employees") {
      const { status = 200, body } = list(url);
      return json(status, body);
    }
    const reply = other?.(request);
    if (reply) return json(reply.status ?? 200, reply.body);
    return json(404, { error: "Not found." });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function toRecordedRequest(input: string, init: RequestInit): RecordedRequest {
  return {
    method: init.method ?? "GET",
    url: new URL(input, "http://localhost"),
    body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    headers: (init.headers ?? {}) as Record<string, string>,
  };
}

// Every request made through the stub, in order.
export function recordedRequests(fetchMock: ReturnType<typeof stubApi>): RecordedRequest[] {
  return fetchMock.mock.calls.map(([input, init]) => toRecordedRequest(input, init ?? {}));
}

// The query parameters of each /api/employees list request, in order.
export function employeeListRequests(fetchMock: ReturnType<typeof stubApi>): URLSearchParams[] {
  return recordedRequests(fetchMock)
    .filter((request) => request.method === "GET" && request.url.pathname === "/api/employees")
    .map((request) => request.url.searchParams);
}
