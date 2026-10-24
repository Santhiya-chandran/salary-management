import type { EmploymentType } from "../types";

// "GBP 85,000.50", "JPY 7,000,000". The API sends money as a decimal string,
// which Intl.NumberFormat formats exactly; it is never turned into a
// JavaScript number, so large salaries aren't rounded.
export function formatMoney(amount: string, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" }).format(
    amount as Intl.StringNumericLiteral,
  );
}

// "3,050"
export function formatCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}

// "2026-10-22" -> "22 October 2026". Read as UTC so the day can't shift with
// the browser's time zone.
export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contractor: "Contractor",
};

export function employmentTypeLabel(type: EmploymentType): string {
  return EMPLOYMENT_TYPE_LABELS[type];
}
