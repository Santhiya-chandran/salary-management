import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test/render";
import { stubApi } from "./test/apiMock";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="token-from-rails">';
    // Pages load data on mount; these tests only check the shell.
    stubApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.innerHTML = "";
  });

  it("shows the app name and who is signed in", () => {
    render(<App userEmail="hr@acme.example" />, { route: "/employees" });

    expect(screen.getByRole("heading", { name: "Salary Management", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("hr@acme.example")).toBeInTheDocument();
  });

  it("signs out with a DELETE /session form carrying the CSRF token", () => {
    render(<App userEmail="hr@acme.example" />, { route: "/employees" });

    const form = screen.getByRole("button", { name: "Sign out" }).closest("form");

    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/session");
    expect(form).toHaveFormValues({ _method: "delete", authenticity_token: "token-from-rails" });
  });

  it("opens the employee list from /", () => {
    render(<App userEmail="hr@acme.example" />, { route: "/" });

    expect(screen.getByRole("heading", { name: "Employees", level: 2 })).toBeInTheDocument();
  });

  it("navigates between Employees and Insights and marks the current page", async () => {
    const user = userEvent.setup();
    render(<App userEmail="hr@acme.example" />, { route: "/employees" });

    expect(screen.getByRole("link", { name: "Employees" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("link", { name: "Insights" }));

    expect(screen.getByRole("heading", { name: "Insights", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Employees" })).not.toHaveAttribute("aria-current");
  });

  it("shows a not-found message for unknown pages", () => {
    render(<App userEmail="hr@acme.example" />, { route: "/employees/oops/really" });

    expect(screen.getByRole("heading", { name: "Page not found", level: 2 })).toBeInTheDocument();
  });
});
