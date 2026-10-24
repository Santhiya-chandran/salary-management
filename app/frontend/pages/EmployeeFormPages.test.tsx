import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { render } from "../test/render";
import { employee, recordedRequests, stubApi, type RecordedRequest } from "../test/apiMock";

function writes(fetchMock: ReturnType<typeof stubApi>): RecordedRequest[] {
  return recordedRequests(fetchMock).filter((request) => request.method !== "GET");
}

function field(label: string | RegExp) {
  return screen.getByLabelText(label, { selector: "input" });
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, label: string | RegExp, option: string) {
  await user.click(field(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

async function fillValidNewEmployee(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field("Full name"), "Priya Sharma");
  await user.type(field("Job title"), "Data Scientist");
  await user.type(field("Department"), "Engineering");
  await chooseOption(user, "Country", "India");
  await user.type(field(/^Salary/), "2,400,000.50");
  await chooseOption(user, "Employment type", "Part-time");
  await user.type(field("Hire date"), "2022-01-10");
}

describe("employee form pages", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="token-from-rails">';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.innerHTML = "";
  });

  describe("adding an employee", () => {
    it("is reached from the list's Add employee button", async () => {
      const user = userEvent.setup();
      stubApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees" });

      await user.click(await screen.findByRole("link", { name: "Add employee" }));

      expect(await screen.findByRole("heading", { name: "Add employee", level: 2 })).toBeInTheDocument();
    });

    // Help text above an input would push it below its neighbour in the same
    // row, so help text goes after the input for every field.
    it("puts each field's help text below its input so fields in a row line up", async () => {
      stubApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/new" });

      for (const [label, help] of [
        ["Job title", "Pick an existing title or type a new one"],
        ["Department", "Pick an existing department or type a new one"],
        ["Currency", "Set by the country"],
        [/^Salary/, "Annual, in the country's currency"],
      ] as const) {
        const input = await screen.findByLabelText(label, { selector: "input" });
        const description = screen.getByText(help);
        expect(input.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it("fills in the currency when a country is chosen", async () => {
      const user = userEvent.setup();
      stubApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/new" });

      await chooseOption(user, "Country", "India");

      expect(field("Currency")).toHaveValue("INR");
      expect(field("Currency")).toHaveAttribute("readonly");
      expect(field(/^Salary/)).toBeInTheDocument();
      expect(screen.getByText("Salary (INR)")).toBeInTheDocument();
    });

    it("suggests existing departments while still allowing a new one", async () => {
      const user = userEvent.setup();
      stubApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/new" });

      await user.type(field("Department"), "Sa");
      await user.click(await screen.findByRole("option", { name: "Sales" }));
      expect(field("Department")).toHaveValue("Sales");

      await user.clear(field("Department"));
      await user.type(field("Department"), "Legal");
      expect(field("Department")).toHaveValue("Legal");
    });

    it("creates the employee and returns to the list with a confirmation", async () => {
      const user = userEvent.setup();
      const fetchMock = stubApi({
        other: ({ method, url }) =>
          method === "POST" && url.pathname === "/api/employees"
            ? { status: 201, body: { employee: employee({ id: 7, full_name: "Priya Sharma" }) } }
            : undefined,
      });
      render(<App userEmail="hr@acme.example" />, { route: "/employees/new" });

      await fillValidNewEmployee(user);
      await user.click(screen.getByRole("button", { name: "Add employee" }));

      expect(await screen.findByText("Priya Sharma was added.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Employees", level: 2 })).toBeInTheDocument();
      const [request] = writes(fetchMock);
      expect(request.method).toBe("POST");
      expect(request.headers["X-CSRF-Token"]).toBe("token-from-rails");
      expect(request.body).toEqual({
        employee: {
          full_name: "Priya Sharma",
          job_title: "Data Scientist",
          department: "Engineering",
          country: "IN",
          currency: "INR",
          salary: "2400000.50",
          employment_type: "part_time",
          hire_date: "2022-01-10",
        },
      });
    });

    it("shows the API's validation errors next to the fields and stays on the form", async () => {
      const user = userEvent.setup();
      stubApi({
        other: ({ method }) =>
          method === "POST"
            ? { status: 422, body: { errors: { salary: ["must be greater than 0"], full_name: ["can't be blank"] } } }
            : undefined,
      });
      render(<App userEmail="hr@acme.example" />, { route: "/employees/new" });

      await fillValidNewEmployee(user);
      await user.click(screen.getByRole("button", { name: "Add employee" }));

      expect(await screen.findByText("must be greater than 0")).toBeInTheDocument();
      expect(screen.getByText("can't be blank")).toBeInTheDocument();
      expect(field(/^Salary/)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("heading", { name: "Add employee", level: 2 })).toBeInTheDocument();
    });
  });

  describe("editing an employee", () => {
    function stubEditApi() {
      return stubApi({
        other: ({ method, url, body }) => {
          if (url.pathname !== "/api/employees/1") return undefined;
          if (method === "GET") return { body: { employee: employee() } };
          if (method === "PATCH") {
            const changes = (body as { employee: Record<string, string> }).employee;
            return { body: { employee: employee({ salary: changes.salary }) } };
          }
          if (method === "DELETE") return { status: 204 };
          return undefined;
        },
      });
    }

    it("is reached from the Edit link in the list, and returns to the same filtered list", async () => {
      const user = userEvent.setup();
      stubApi({
        list: () => ({ body: { employees: [employee()], meta: { page: 1, per_page: 25, total_count: 1, total_pages: 1 } } }),
        other: ({ method, url }) =>
          url.pathname === "/api/employees/1" && method === "GET" ? { body: { employee: employee() } } : undefined,
      });
      render(<App userEmail="hr@acme.example" />, { route: "/employees?country=GB" });

      await user.click(await screen.findByRole("link", { name: "Edit Ada Lovelace" }));
      expect(await screen.findByRole("heading", { name: "Edit employee", level: 2 })).toBeInTheDocument();

      await user.click(screen.getByRole("link", { name: "Cancel" }));
      expect(await screen.findByLabelText("Country", { selector: "input" })).toHaveValue("United Kingdom");
    });

    it("loads the employee into the form", async () => {
      stubEditApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/1/edit" });

      await waitFor(() => expect(field("Full name")).toHaveValue("Ada Lovelace"));
      expect(field("Country")).toHaveValue("United Kingdom");
      expect(field("Currency")).toHaveValue("GBP");
      expect(field(/^Salary/)).toHaveValue("85000.50");
      expect(field("Hire date")).toHaveValue("2023-04-01");
    });

    it("saves changes, including a new current salary", async () => {
      const user = userEvent.setup();
      const fetchMock = stubEditApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/1/edit" });
      await waitFor(() => expect(field(/^Salary/)).toHaveValue("85000.50"));

      await user.clear(field(/^Salary/));
      await user.type(field(/^Salary/), "90000");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(await screen.findByText("Ada Lovelace was updated.")).toBeInTheDocument();
      const [request] = writes(fetchMock);
      expect(request.method).toBe("PATCH");
      expect(request.url.pathname).toBe("/api/employees/1");
      expect((request.body as { employee: Record<string, string> }).employee.salary).toBe("90000");
    });

    it("says so when the employee doesn't exist", async () => {
      stubApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/999/edit" });

      expect(await screen.findByRole("alert")).toHaveTextContent("Not found.");
    });

    it("asks for confirmation before deleting, and does nothing if cancelled", async () => {
      const user = userEvent.setup();
      const fetchMock = stubEditApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/1/edit" });
      await waitFor(() => expect(field("Full name")).toHaveValue("Ada Lovelace"));

      await user.click(screen.getByRole("button", { name: "Delete employee" }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveTextContent("Delete Ada Lovelace? This can't be undone.");

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(writes(fetchMock)).toEqual([]);
    });

    it("deletes after confirmation and returns to the list", async () => {
      const user = userEvent.setup();
      const fetchMock = stubEditApi();
      render(<App userEmail="hr@acme.example" />, { route: "/employees/1/edit" });
      await waitFor(() => expect(field("Full name")).toHaveValue("Ada Lovelace"));

      await user.click(screen.getByRole("button", { name: "Delete employee" }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Ada Lovelace was deleted.")).toBeInTheDocument();
      const [request] = writes(fetchMock);
      expect(request.method).toBe("DELETE");
      expect(request.url.pathname).toBe("/api/employees/1");
    });
  });
});
