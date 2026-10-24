import { Stack, Table, Text } from "@mantine/core";
import { formatCount, formatMoney } from "../../lib/format";
import { useApiGet } from "../../lib/useApiGet";
import type { CountryInsight } from "../../types";
import { InsightStatus } from "./InsightStatus";

// Min, average and max salary per country, in local currency.
export function ByCountryInsight() {
  const { data, loading, error } = useApiGet<{ countries: CountryInsight[] }>("/api/insights/by_country");
  const countries = data?.countries ?? [];

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Salaries are shown in each country's own currency. Use the USD comparison to compare across countries.
      </Text>
      <InsightStatus loading={loading} error={error} empty={countries.length === 0}>
        <Table.ScrollContainer minWidth={700}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">Employees</Table.Th>
                <Table.Th ta="right">Minimum</Table.Th>
                <Table.Th ta="right">Average</Table.Th>
                <Table.Th ta="right">Maximum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countries.map((row) => (
                <Table.Tr key={row.country}>
                  <Table.Td>{row.country_name}</Table.Td>
                  <Table.Td ta="right">{formatCount(row.headcount)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(row.min_salary, row.currency)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(row.average_salary, row.currency)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(row.max_salary, row.currency)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </InsightStatus>
    </Stack>
  );
}
