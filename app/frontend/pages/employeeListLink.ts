import { useLocation } from "react-router";

// The form pages remember the list's query string (filters, sort, page) that
// the user came from, passed in location state, so Cancel and Save return to
// the same filtered list.
export type FromListState = { from?: string };

export function useEmployeeListUrl(): string {
  const state = useLocation().state as FromListState | null;
  return `/employees${state?.from ?? ""}`;
}
