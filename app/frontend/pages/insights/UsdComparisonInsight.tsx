import { Alert, Stack, Table } from "@mantine/core";
import { formatCount, formatLongDate, formatMoney } from "../../lib/format";
import { useApiGet } from "../../lib/useApiGet";
import type { UsdComparison } from "../../types";
import { InsightStatus } from "./InsightStatus";

// Each country's salaries converted to approximate USD with fixed reference
// rates, highest average first. The only view that puts countries side by side.
export function UsdComparisonInsight() {
  const { data, loading, error } = useApiGet<UsdComparison>("/api/insights/usd_comparison");
  const countries = data?.countries ?? [];

  return (
    <Stack gap="sm">
      {data && (
        <Alert color="blue" variant="light">
          Approximate. Converted at the {data.rates_source} of {formatLongDate(data.rates_as_of)}. Salaries are paid
          and stored in local currency; the other views show them unconverted.
        </Alert>
      )}
      <InsightStatus loading={loading} error={error} empty={countries.length === 0}>
        <Table.ScrollContainer minWidth={880}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">Employees</Table.Th>
                <Table.Th>Rate used</Table.Th>
                <Table.Th ta="right">Minimum</Table.Th>
                <Table.Th ta="right">Average</Table.Th>
                <Table.Th ta="right">Median</Table.Th>
                <Table.Th ta="right">Maximum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countries.map((row) => (
                <Table.Tr key={row.country}>
                  <Table.Td>{row.country_name}</Table.Td>
                  <Table.Td ta="right">{formatCount(row.headcount)}</Table.Td>
                  <Table.Td>
                    1 USD = {row.usd_rate} {row.currency}
                  </Table.Td>
                  <Table.Td ta="right">{formatMoney(row.min_usd, "USD")}</Table.Td>
                  <Table.Td ta="right">{formatMoney(row.average_usd, "USD")}</Table.Td>
                  <Table.Td ta="right">{formatMoney(row.median_usd, "USD")}</Table.Td>
                  <Table.Td ta="right">{formatMoney(row.max_usd, "USD")}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </InsightStatus>
    </Stack>
  );
}
