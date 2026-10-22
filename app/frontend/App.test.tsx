import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "./test/render";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="token-from-rails">';
  });

  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("shows the app name and who is signed in", () => {
    render(<App userEmail="hr@acme.example" />);

    expect(screen.getByRole("heading", { name: "Salary Management" })).toBeInTheDocument();
    expect(screen.getByText("hr@acme.example")).toBeInTheDocument();
  });

  it("signs out with a DELETE /session form carrying the CSRF token", () => {
    render(<App userEmail="hr@acme.example" />);

    const button = screen.getByRole("button", { name: "Sign out" });
    const form = button.closest("form");

    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/session");
    expect(form).toHaveFormValues({
      _method: "delete",
      authenticity_token: "token-from-rails",
    });
  });
});
