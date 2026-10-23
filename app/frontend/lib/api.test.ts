import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, ValidationError, apiGet, apiSend, buildQuery, navigation } from "./api";

function jsonResponse(status: number, body: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="token-from-rails">';
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
    document.head.innerHTML = "";
  });

  describe("buildQuery", () => {
    it("skips empty values and encodes the rest", () => {
      expect(buildQuery({ search: "R&D team", country: "", page: 2, department: null, sort: undefined })).toBe(
        "?search=R%26D+team&page=2",
      );
    });

    it("returns an empty string when nothing is set", () => {
      expect(buildQuery({ search: "" })).toBe("");
    });
  });

  describe("apiGet", () => {
    it("requests JSON with the query string and returns the parsed body", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { employees: [] }));

      const data = await apiGet("/api/employees", { search: "ada" });

      expect(data).toEqual({ employees: [] });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/employees?search=ada");
      expect(init.method).toBe("GET");
      expect(init.headers).toEqual({ Accept: "application/json" });
    });

    it("passes an abort signal through", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const controller = new AbortController();

      await apiGet("/api/employees", {}, { signal: controller.signal });

      expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    });
  });

  describe("apiSend", () => {
    it("sends JSON with the CSRF token header", async () => {
      fetchMock.mockResolvedValue(jsonResponse(201, { employee: { id: 1 } }));

      const data = await apiSend("POST", "/api/employees", { employee: { full_name: "Ada" } });

      expect(data).toEqual({ employee: { id: 1 } });
      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-Token": "token-from-rails",
      });
      expect(init.body).toBe('{"employee":{"full_name":"Ada"}}');
    });

    it("returns undefined for 204 No Content", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      await expect(apiSend("DELETE", "/api/employees/1")).resolves.toBeUndefined();
    });
  });

  describe("errors", () => {
    it("sends the browser to the login page on 401", async () => {
      const toLogin = vi.spyOn(navigation, "toLogin").mockImplementation(() => {});
      fetchMock.mockResolvedValue(jsonResponse(401, { error: "You need to sign in." }));

      await expect(apiGet("/api/employees")).rejects.toMatchObject({ status: 401 });
      expect(toLogin).toHaveBeenCalledOnce();
    });

    it("throws a ValidationError with the field errors on 422", async () => {
      const errors = { salary: ["must be greater than 0"] };
      fetchMock.mockResolvedValue(jsonResponse(422, { errors }));

      const error = await apiSend("POST", "/api/employees", {}).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual(errors);
      expect((error as ValidationError).status).toBe(422);
    });

    it("throws an ApiError with the server's message for other failures", async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, { error: "Not found." }));

      const error = await apiGet("/api/employees/9").catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).not.toBeInstanceOf(ValidationError);
      expect((error as ApiError).message).toBe("Not found.");
      expect((error as ApiError).status).toBe(404);
    });

    it("falls back to a generic message when the body isn't JSON", async () => {
      fetchMock.mockResolvedValue(new Response("<html>oops</html>", { status: 500 }));

      await expect(apiGet("/api/employees")).rejects.toThrow("Request failed (500)");
    });
  });
});
