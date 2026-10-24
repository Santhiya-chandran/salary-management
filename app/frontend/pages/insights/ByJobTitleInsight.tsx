import { lazy, Suspense } from "react";
import { Loader, Select, Stack, Table, Text } from "@mantine/core";
import { useSearchParams } from "react-router";
import { formatCount, formatMoney } from "../../lib/format";
import { useApiGet } from "../../lib/useApiGet";
import type { FilterOptions, JobTitleInsights } from "../../types";
import { InsightStatus } from "./InsightStatus";

// The chart pulls in recharts, which is larger than the rest of the app put
// together, so it is downloaded only when this view first shows a chart.
const JobTitleChart = lazy(() => import("./JobTitleChart").then((module) => ({ default: module.JobTitleChart })));

// Average (and min, max) salary per job title within one country. The
// country is kept in the URL (?country=IN).
export function ByJobTitleInsight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const country = searchParams.get("country") ?? "";
  const options = useApiGet<FilterOptions>("/api/employees/filters");
  const { data, loading, error } = useApiGet<JobTitleInsights>(
    country ? "/api/insights/by_job_title" : null,
    { country },
  );
  const jobTitles = data?.job_titles ?? [];

  return (
    <Stack gap="sm">
      <Select
        label="Country"
        placeholder="Choose a country"
        data={(options.data?.countries ?? []).map((option) => ({ value: option.code, label: option.name }))}
        value={country || null}
        onChange={(value) => setSearchParams(value ? { country: value } : {})}
        searchable
        w={{ base: "100%", sm: 260 }}
      />

      {!country ? (
        <Text c="dimmed">Choose a country to see average salaries by job title.</Text>
      ) : (
        <InsightStatus
          loading={loading}
          error={error}
          empty={jobTitles.length === 0}
          emptyMessage="No employees in this country yet."
        >
          {data && (
            <Suspense fallback={<Loader size="sm" aria-label="Loading chart" />}>
              <JobTitleChart rows={jobTitles} countryName={data.country_name} currency={data.currency} />
            </Suspense>
          )}
          <Text size="sm" c="dimmed">
            In {data?.currency}, highest average first.
          </Text>
          <Table.ScrollContainer minWidth={820}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job title</Table.Th>
                  <Table.Th ta="right">Employees</Table.Th>
                  <Table.Th ta="right">Average</Table.Th>
                  <Table.Th ta="right">Median</Table.Th>
                  <Table.Th ta="right">Minimum</Table.Th>
                  <Table.Th ta="right">Maximum</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {jobTitles.map((row) => (
                  <Table.Tr key={row.job_title}>
                    <Table.Td>{row.job_title}</Table.Td>
                    <Table.Td ta="right">{formatCount(row.headcount)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.average_salary, data!.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.median_salary, data!.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.min_salary, data!.currency)}</Table.Td>
                    <Table.Td ta="right">{formatMoney(row.max_salary, data!.currency)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </InsightStatus>
      )}
    </Stack>
  );
}
