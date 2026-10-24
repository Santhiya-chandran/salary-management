import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { App } from "../App";
import { render } from "../test/render";
import { recordedRequests, stubApi } from "../test/apiMock";

// Testing Library turns the non-breaking space after a currency code into a
// plain space, so expected text uses a plain space.

const byCountry = {
  countries: [
    { country: "IN", country_name: "India", currency: "INR", headcount: 2,
      min_salary: "1000000.00", max_salary: "2000001.00", average_salary: "1500000.50" },
    { country: "GB", country_name: "United Kingdom", currency: "GBP", headcount: 3,
      min_salary: "50000.00", max_salary: "70001.00", average_salary: "60000.33" },
  ],
};

const byJobTitle = {
  country: "IN", country_name: "India", currency: "INR",
  job_titles: [
    { job_title: "Engineer", headcount: 2, average_salary: "2500000.50", min_salary: "2000000.00", max_salary: "3000001.00" },
  ],
};

const headcount = {
  rows: [
    { country: "IN", country_name: "India", department: "Engineering", headcount: 2 },
    { country: "GB", country_name: "United Kingdom", department: "Engineering", headcount: 2 },
    { country: "GB", country_name: "United Kingdom", department: "People", headcount: 1 },
  ],
};

const usdComparison = {
  rates_as_of: "2026-10-22",
  rates_source: "European Central Bank euro foreign exchange reference rates",
  countries: [
    { country: "GB", country_name: "United Kingdom", currency: "GBP", usd_rate: "0.7476", headcount: 3,
      min_usd: "66879.55", max_usd: "93632.71", average_usd: "80255.91" },
    { country: "IN", country_name: "India", currency: "INR", usd_rate: "94.8228", headcount: 2,
      min_usd: "10545.98", max_usd: "21091.97", average_usd: "15818.98" },
  ],
};

function stubInsightsApi({ failing }: { failing?: string } = {}) {
  return stubApi({
    other: ({ method, url }) => {
      if (method !== "GET" || !url.pathname.startsWith("/api/insights/")) return undefined;
      if (url.pathname === failing) return { status: 500, body: { error: "Something went wrong." } };
      switch (url.pathname) {
        case "/api/insights/by_country": return { body: byCountry };
        case "/api/insights/by_job_title": return { body: byJobTitle };
        case "/api/insights/headcount": return { body: headcount };
        case "/api/insights/usd_comparison": return { body: usdComparison };
      }
      return undefined;
    },
  });
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderInsights(route: string) {
  return render(
    <>
      <App userEmail="hr@acme.example" />
      <LocationProbe />
    </>,
    { route },
  );
}

function rowFor(text: string) {
  return screen.getByRole("cell", { name: text }).closest("tr")!;
}

describe("InsightsPage", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="token-from-rails">';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.innerHTML = "";
  });

  it("opens on the by-country view and switches views with tabs that have their own URLs", async () => {
    const user = userEvent.setup();
    stubInsightsApi();
    renderInsights("/insights");

    expect(await screen.findByRole("tab", { name: "By country" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("location")).toHaveTextContent("/insights/by-country");

    await user.click(screen.getByRole("tab", { name: "Headcount" }));

    expect(screen.getByRole("tab", { name: "Headcount" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("location")).toHaveTextContent("/insights/headcount");
  });

  it("shows min, average and max salary per country in local currency", async () => {
    stubInsightsApi();
    renderInsights("/insights/by-country");

    await screen.findByRole("cell", { name: "United Kingdom" });
    const uk = within(rowFor("United Kingdom"));
    expect(uk.getByText("3")).toBeInTheDocument();
    expect(uk.getByText("GBP 50,000.00")).toBeInTheDocument();
    expect(uk.getByText("GBP 60,000.33")).toBeInTheDocument();
    expect(uk.getByText("GBP 70,001.00")).toBeInTheDocument();
    expect(within(rowFor("India")).getByText("INR 1,500,000.50")).toBeInTheDocument();
    expect(screen.getByText(/each country's own currency/)).toBeInTheDocument();
  });

  describe("by job title", () => {
    it("asks for a country before loading anything", async () => {
      const fetchMock = stubInsightsApi();
      renderInsights("/insights/by-job-title");

      expect(await screen.findByText("Choose a country to see average salaries by job title.")).toBeInTheDocument();
      expect(recordedRequests(fetchMock).some((r) => r.url.pathname === "/api/insights/by_job_title")).toBe(false);
    });

    it("loads the chosen country's job titles and keeps the country in the URL", async () => {
      const user = userEvent.setup();
      const fetchMock = stubInsightsApi();
      renderInsights("/insights/by-job-title");

      await user.click(await screen.findByLabelText("Country", { selector: "input" }));
      await user.click(await screen.findByRole("option", { name: "India" }));

      await screen.findByRole("cell", { name: "Engineer" });
      const engineer = within(rowFor("Engineer"));
      expect(engineer.getByText("2")).toBeInTheDocument();
      expect(engineer.getByText("INR 2,500,000.50")).toBeInTheDocument();
      expect(engineer.getByText("INR 2,000,000.00")).toBeInTheDocument();
      expect(engineer.getByText("INR 3,000,001.00")).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent("/insights/by-job-title?country=IN");
      const request = recordedRequests(fetchMock).find((r) => r.url.pathname === "/api/insights/by_job_title")!;
      expect(request.url.searchParams.get("country")).toBe("IN");
    });
  });

  it("shows headcount as a grid of countries and departments with totals", async () => {
    stubInsightsApi();
    renderInsights("/insights/headcount");

    await screen.findByRole("cell", { name: "United Kingdom" });
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(["Country", "Engineering", "People", "Total"]);
    expect(within(rowFor("United Kingdom")).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "United Kingdom", "2", "1", "3",
    ]);
    expect(within(rowFor("India")).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "India", "2", "0", "2",
    ]);
    expect(within(rowFor("All countries")).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "All countries", "4", "1", "5",
    ]);
  });

  it("compares countries in approximate USD and says which rates were used", async () => {
    stubInsightsApi();
    renderInsights("/insights/usd-comparison");

    await screen.findByRole("cell", { name: "United Kingdom" });
    expect(screen.getByText(/Approximate/)).toHaveTextContent(
      "European Central Bank euro foreign exchange reference rates of 22 October 2026",
    );
    const uk = within(rowFor("United Kingdom"));
    expect(uk.getByText("1 USD = 0.7476 GBP")).toBeInTheDocument();
    expect(uk.getByText("USD 80,255.91")).toBeInTheDocument();
    expect(uk.getByText("USD 66,879.55")).toBeInTheDocument();
    expect(uk.getByText("USD 93,632.71")).toBeInTheDocument();
    const countries = screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);
    expect(countries).toEqual(["United Kingdom", "India"]);
  });

  it("shows an error when an insight can't be loaded", async () => {
    stubInsightsApi({ failing: "/api/insights/headcount" });
    renderInsights("/insights/headcount");

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
  });

  it("says when there is no data yet", async () => {
    stubApi({
      other: ({ url }) => (url.pathname === "/api/insights/by_country" ? { body: { countries: [] } } : undefined),
    });
    renderInsights("/insights/by-country");

    expect(await screen.findByText("No employees yet.")).toBeInTheDocument();
  });

  it("treats an unknown insights URL as not found", async () => {
    stubInsightsApi();
    renderInsights("/insights/nonsense");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Page not found", level: 2 })).toBeInTheDocument());
  });
});
