import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { render } from "../test/render";
import { employee, employeeListRequests, listResponse, stubApi } from "../test/apiMock";
import { EmployeesPage } from "./EmployeesPage";

// Testing Library normalises the non-breaking space Intl puts after the
// currency code into a plain space, so expected text uses a plain space.

// Shows the current URL so tests can check what the page wrote to it.
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderPage(route = "/employees") {
  return render(
    <Routes>
      <Route
        path="/employees"
        element={
          <>
            <EmployeesPage />
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { route },
  );
}

function lastListRequest(fetchMock: ReturnType<typeof stubApi>) {
  return employeeListRequests(fetchMock).at(-1)!;
}

describe("EmployeesPage", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lists employees with salary shown in their own currency", async () => {
    stubApi({
      list: () => ({
        body: listResponse([
          employee({ id: 1, full_name: "Ada Lovelace", salary: "85000.50", currency: "GBP" }),
          employee({
            id: 2, full_name: "Priya Sharma", country: "IN", country_name: "India", currency: "INR",
            salary: "2400000.00", employment_type: "part_time", hire_date: "2022-01-10",
          }),
        ]),
      }),
    });

    renderPage();

    const row = (await screen.findByText("Priya Sharma")).closest("tr")!;
    expect(within(row).getByText("INR 2,400,000.00")).toBeInTheDocument();
    expect(within(row).getByText("India")).toBeInTheDocument();
    expect(within(row).getByText("Part-time")).toBeInTheDocument();
    expect(within(row).getByText("2022-01-10")).toBeInTheDocument();
    expect(screen.getByText("GBP 85,000.50")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();
  });

  it("requests the list using the filters, sort and page in the URL", async () => {
    const fetchMock = stubApi();

    renderPage("/employees?country=IN&department=People&sort=hire_date&direction=desc&page=2");

    await waitFor(() => expect(employeeListRequests(fetchMock)).toHaveLength(1));
    expect(Object.fromEntries(lastListRequest(fetchMock))).toEqual({
      country: "IN", department: "People", sort: "hire_date", direction: "desc", page: "2",
    });
    expect(await screen.findByLabelText("Country", { selector: "input" })).toHaveValue("India");
  });

  it("searches by name after the user stops typing, starting again at page 1", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = stubApi();
    renderPage("/employees?page=3");
    await waitFor(() => expect(employeeListRequests(fetchMock)).toHaveLength(1));

    await user.type(screen.getByRole("textbox", { name: "Search by name" }), "ada");
    expect(employeeListRequests(fetchMock)).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(300);

    await waitFor(() => expect(lastListRequest(fetchMock).get("search")).toBe("ada"));
    expect(lastListRequest(fetchMock).has("page")).toBe(false);
    expect(employeeListRequests(fetchMock).filter((params) => params.has("search"))).toHaveLength(1);
    expect(screen.getByTestId("location")).toHaveTextContent("/employees?search=ada");
  });

  it("filters by department and starts again at page 1", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderPage("/employees?page=2");

    await user.click(await screen.findByLabelText("Department", { selector: "input" }));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));

    await waitFor(() => expect(lastListRequest(fetchMock).get("department")).toBe("Engineering"));
    expect(lastListRequest(fetchMock).has("page")).toBe(false);
  });

  it("sorts by a column, toggling the direction on a second click", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({ list: () => ({ body: listResponse([employee()]) }) });
    renderPage();
    await screen.findByText("Ada Lovelace");

    await user.click(screen.getByRole("button", { name: /Hire date/ }));
    await waitFor(() => expect(lastListRequest(fetchMock).get("sort")).toBe("hire_date"));
    expect(lastListRequest(fetchMock).get("direction")).toBe("asc");
    expect(screen.getByRole("columnheader", { name: /Hire date/ })).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: /Hire date/ }));
    await waitFor(() => expect(lastListRequest(fetchMock).get("direction")).toBe("desc"));
    expect(screen.getByRole("columnheader", { name: /Hire date/ })).toHaveAttribute("aria-sort", "descending");
  });

  // Found in user testing: with an arrow only on the sorted column, people
  // didn't realise the other headers could be clicked.
  it("shows a sort icon on every sortable header before anything is clicked", async () => {
    stubApi({ list: () => ({ body: listResponse([employee()]) }) });
    renderPage();
    await screen.findByText("Ada Lovelace");

    // No sort in the URL means name ascending, the API's default.
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveTextContent("Name▲");
    expect(screen.getByRole("columnheader", { name: "Salary" })).toHaveTextContent("Salary↕");
    expect(screen.getByRole("columnheader", { name: "Hire date" })).toHaveTextContent("Hire date↕");
    // Columns that can't be sorted get no icon.
    expect(screen.getByRole("columnheader", { name: "Department" })).toHaveTextContent(/^Department$/);
  });

  it("keeps the icon out of the button's accessible name and explains it on hover", async () => {
    stubApi({ list: () => ({ body: listResponse([employee()]) }) });
    renderPage();
    await screen.findByText("Ada Lovelace");

    const button = screen.getByRole("button", { name: "Salary" });
    expect(button).toHaveAttribute("title", "Sort by salary");
  });

  it("explains that salaries are in local currencies when sorting by salary across countries", async () => {
    stubApi({ list: () => ({ body: listResponse([employee()]) }) });
    renderPage("/employees?sort=salary");

    expect(await screen.findByText(/each country's currency/)).toBeInTheDocument();
  });

  it("doesn't show that note once a country is selected", async () => {
    stubApi({ list: () => ({ body: listResponse([employee()]) }) });
    renderPage("/employees?sort=salary&country=GB");

    await screen.findByText("Ada Lovelace");
    expect(screen.queryByText(/each country's currency/)).not.toBeInTheDocument();
  });

  it("moves between pages", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({
      list: (url) => ({
        body: listResponse([employee()], {
          page: Number(url.searchParams.get("page") ?? 1), total_count: 60, total_pages: 3,
        }),
      }),
    });
    renderPage();
    await screen.findByText("Showing 1–25 of 60");

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => expect(lastListRequest(fetchMock).get("page")).toBe("2"));
    expect(await screen.findByText("Showing 26–50 of 60")).toBeInTheDocument();
  });

  it("says so when no employees match", async () => {
    stubApi();
    renderPage("/employees?search=nobody");

    expect(await screen.findByText("No employees match your search and filters.")).toBeInTheDocument();
  });

  it("shows an error when the list can't be loaded", async () => {
    stubApi({ list: () => ({ status: 500, body: { error: "Something went wrong." } }) });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
  });
});
