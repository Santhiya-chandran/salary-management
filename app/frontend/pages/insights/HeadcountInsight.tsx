import { Table } from "@mantine/core";
import { formatCount } from "../../lib/format";
import { useApiGet } from "../../lib/useApiGet";
import type { HeadcountRow } from "../../types";
import { InsightStatus } from "./InsightStatus";

type Grid = {
  departments: string[];
  countries: { code: string; name: string; counts: Map<string, number>; total: number }[];
  departmentTotals: Map<string, number>;
  grandTotal: number;
};

// Lays the API's (country, department, headcount) rows out as a grid. The
// counts are already computed in SQL; this only adds up at most a few dozen
// of them for the Total row and column.
export function toGrid(rows: HeadcountRow[]): Grid {
  const departments = [...new Set(rows.map((row) => row.department))].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );
  const countries: Grid["countries"] = [];
  const departmentTotals = new Map<string, number>();

  for (const row of rows) {
    let country = countries.find((entry) => entry.code === row.country);
    if (!country) {
      country = { code: row.country, name: row.country_name, counts: new Map(), total: 0 };
      countries.push(country);
    }
    country.counts.set(row.department, row.headcount);
    country.total += row.headcount;
    departmentTotals.set(row.department, (departmentTotals.get(row.department) ?? 0) + row.headcount);
  }

  const grandTotal = countries.reduce((sum, country) => sum + country.total, 0);
  return { departments, countries, departmentTotals, grandTotal };
}

// Number of employees per country and department.
export function HeadcountInsight() {
  const { data, loading, error } = useApiGet<{ rows: HeadcountRow[] }>("/api/insights/headcount");
  const grid = toGrid(data?.rows ?? []);

  return (
    <InsightStatus loading={loading} error={error} empty={grid.countries.length === 0}>
      <Table.ScrollContainer minWidth={700}>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Country</Table.Th>
              {grid.departments.map((department) => (
                <Table.Th key={department} ta="right">
                  {department}
                </Table.Th>
              ))}
              <Table.Th ta="right">Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {grid.countries.map((country) => (
              <Table.Tr key={country.code}>
                <Table.Td>{country.name}</Table.Td>
                {grid.departments.map((department) => (
                  <Table.Td key={department} ta="right">
                    {formatCount(country.counts.get(department) ?? 0)}
                  </Table.Td>
                ))}
                <Table.Td ta="right" fw={700}>
                  {formatCount(country.total)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
          <Table.Tfoot>
            <Table.Tr fw={700}>
              <Table.Td>All countries</Table.Td>
              {grid.departments.map((department) => (
                <Table.Td key={department} ta="right">
                  {formatCount(grid.departmentTotals.get(department) ?? 0)}
                </Table.Td>
              ))}
              <Table.Td ta="right">{formatCount(grid.grandTotal)}</Table.Td>
            </Table.Tr>
          </Table.Tfoot>
        </Table>
      </Table.ScrollContainer>
    </InsightStatus>
  );
}
