import { afterEach, describe, expect, it } from "vitest";
import { csrfToken } from "./csrf";

describe("csrfToken", () => {
  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("reads the token Rails renders in the csrf-token meta tag", () => {
    document.head.innerHTML = '<meta name="csrf-token" content="abc123">';

    expect(csrfToken()).toBe("abc123");
  });

  it("throws when the meta tag is missing", () => {
    expect(() => csrfToken()).toThrow("CSRF token meta tag not found");
  });
});
