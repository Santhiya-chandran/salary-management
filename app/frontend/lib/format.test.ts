import { describe, expect, it } from "vitest";
import { formatMoney, employmentTypeLabel } from "./format";

// Intl puts a non-breaking space (U+00A0) between the code and the amount.
const NBSP = " ";

describe("formatMoney", () => {
  it("shows the currency code and groups thousands", () => {
    expect(formatMoney("85000.50", "GBP")).toBe(`GBP${NBSP}85,000.50`);
    expect(formatMoney("1500000.00", "INR")).toBe(`INR${NBSP}1,500,000.00`);
  });

  it("uses the currency's usual decimals", () => {
    expect(formatMoney("7000000.00", "JPY")).toBe(`JPY${NBSP}7,000,000`);
  });

  it("keeps large amounts exact because it never converts to a number", () => {
    expect(formatMoney("9999999999999.99", "USD")).toBe(`USD${NBSP}9,999,999,999,999.99`);
  });
});

describe("employmentTypeLabel", () => {
  it("turns API values into readable labels", () => {
    expect(employmentTypeLabel("full_time")).toBe("Full-time");
    expect(employmentTypeLabel("part_time")).toBe("Part-time");
    expect(employmentTypeLabel("contractor")).toBe("Contractor");
  });
});
