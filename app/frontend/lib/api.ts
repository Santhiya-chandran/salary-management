import { csrfToken } from "./csrf";

// Small wrapper around fetch for the Rails JSON API (same origin, so the
// session cookie is sent automatically). Turns failures into typed errors.

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// 422: the record was invalid. `errors` maps field names to messages,
// e.g. { salary: ["must be greater than 0"] }.
export class ValidationError extends ApiError {
  readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Please fix the highlighted fields.", 422);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

// Kept on an object so tests can replace it (jsdom can't navigate).
export const navigation = {
  toLogin() {
    window.location.assign("/session/new");
  },
};

export type QueryParams = Record<string, string | number | null | undefined>;

// "?a=1&b=2", leaving out empty values; "" when nothing is set.
export function buildQuery(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

type RequestOptions = { signal?: AbortSignal };

export function apiGet<T>(path: string, params: QueryParams = {}, options: RequestOptions = {}): Promise<T> {
  return request<T>("GET", `${path}${buildQuery(params)}`, undefined, options);
}

// Writes carry the CSRF token Rails expects in the X-CSRF-Token header.
export function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>(method, path, body, options);
}

async function request<T>(method: string, url: string, body: unknown, { signal }: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = csrfToken();
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    signal,
  });

  if (response.status === 401) {
    // The session has ended; the login page brings the user back afterwards.
    navigation.toLogin();
    throw new ApiError("You need to sign in.", 401);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (response.status === 422 && data?.errors) throw new ValidationError(data.errors);
  if (!response.ok) throw new ApiError(data?.error ?? `Request failed (${response.status})`, response.status);

  return data as T;
}
