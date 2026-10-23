import { useEffect, useState } from "react";
import {
  Alert, Box, Group, LoadingOverlay, Pagination, Select, Stack, Table, Text, TextInput, Title, UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchParams } from "react-router";
import { employmentTypeLabel, formatCount, formatMoney } from "../lib/format";
import { useApiGet } from "../lib/useApiGet";
import type { EmployeeListResponse, FilterOptions } from "../types";

type SortColumn = "full_name" | "salary" | "hire_date";
type Direction = "asc" | "desc";

const SEARCH_DEBOUNCE_MS = 300;

// The list's search, filters, sort and page live in the URL (the same names
// the API uses), so back/forward, refresh and shared links all work.
export function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = (name: string) => searchParams.get(name) ?? "";

  const filters = { country: param("country"), department: param("department"), job_title: param("job_title") };
  const sort = (param("sort") || "full_name") as SortColumn;
  const direction: Direction = param("direction") === "desc" ? "desc" : "asc";

  // Changing the search, a filter or the sort starts again at page 1.
  function updateParams(changes: Record<string, string | null>, { keepPage = false, replace = false } = {}) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (!keepPage) next.delete("page");
        return next;
      },
      { replace },
    );
  }

  const urlSearch = param("search");
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch] = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  // Typing updates the URL once the user pauses...
  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) updateParams({ search: debouncedSearch.trim() }, { replace: true });
  }, [debouncedSearch]);

  // ...and a URL change from elsewhere (back button, link) updates the box.
  useEffect(() => {
    setSearchInput((current) => (current.trim() === urlSearch ? current : urlSearch));
  }, [urlSearch]);

  const list = useApiGet<EmployeeListResponse>("/api/employees", {
    search: urlSearch,
    ...filters,
    sort: param("sort"),
    direction: param("direction"),
    page: param("page"),
  });
  const options = useApiGet<FilterOptions>("/api/employees/filters");

  function onSort(column: SortColumn) {
    const nextDirection = column === sort && direction === "asc" ? "desc" : "asc";
    updateParams({ sort: column, direction: nextDirection });
  }

  const meta = list.data?.meta;
  const employees = list.data?.employees ?? [];

  return (
    <Stack gap="md">
      <Title order={2}>Employees</Title>

      <Group align="flex-end" gap="sm">
        <TextInput
          label="Search by name"
          placeholder="e.g. Ada"
          value={searchInput}
          onChange={(event) => setSearchInput(event.currentTarget.value)}
          w={{ base: "100%", sm: 220 }}
        />
        <Select
          label="Country"
          placeholder="All countries"
          data={(options.data?.countries ?? []).map((country) => ({ value: country.code, label: country.name }))}
          value={filters.country || null}
          onChange={(value) => updateParams({ country: value })}
          searchable
          clearable
          w={{ base: "100%", sm: 190 }}
        />
        <Select
          label="Department"
          placeholder="All departments"
          data={options.data?.departments ?? []}
          value={filters.department || null}
          onChange={(value) => updateParams({ department: value })}
          searchable
          clearable
          w={{ base: "100%", sm: 190 }}
        />
        <Select
          label="Job title"
          placeholder="All job titles"
          data={options.data?.job_titles ?? []}
          value={filters.job_title || null}
          onChange={(value) => updateParams({ job_title: value })}
          searchable
          clearable
          w={{ base: "100%", sm: 230 }}
        />
      </Group>

      {sort === "salary" && !filters.country && (
        <Text size="sm" c="dimmed">
          Salaries are in each country's currency, so sorting across countries mixes currencies. Filter by country
          to compare like with like.
        </Text>
      )}

      {list.error && (
        <Alert color="red" title="Couldn't load employees">
          {list.error}
        </Alert>
      )}

      <Box pos="relative">
        <LoadingOverlay visible={list.loading} overlayProps={{ blur: 1 }} />
        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableHeader column="full_name" label="Name" sort={sort} direction={direction} onSort={onSort} />
                <Table.Th>Job title</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Country</Table.Th>
                <SortableHeader column="salary" label="Salary" sort={sort} direction={direction} onSort={onSort} align="right" />
                <Table.Th>Type</Table.Th>
                <SortableHeader column="hire_date" label="Hire date" sort={sort} direction={direction} onSort={onSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employees.map((employee) => (
                <Table.Tr key={employee.id}>
                  <Table.Td>{employee.full_name}</Table.Td>
                  <Table.Td>{employee.job_title}</Table.Td>
                  <Table.Td>{employee.department}</Table.Td>
                  <Table.Td>{employee.country_name}</Table.Td>
                  <Table.Td ta="right" style={{ whiteSpace: "nowrap" }}>
                    {formatMoney(employee.salary, employee.currency)}
                  </Table.Td>
                  <Table.Td>{employmentTypeLabel(employee.employment_type)}</Table.Td>
                  <Table.Td>{employee.hire_date}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {!list.loading && !list.error && employees.length === 0 && (
          <Text ta="center" c="dimmed" py="xl">
            No employees match your search and filters.
          </Text>
        )}
      </Box>

      {meta && meta.total_count > 0 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {formatCount((meta.page - 1) * meta.per_page + 1)}–
            {formatCount(Math.min(meta.page * meta.per_page, meta.total_count))} of {formatCount(meta.total_count)}
          </Text>
          {meta.total_pages > 1 && (
            <Pagination
              total={meta.total_pages}
              value={meta.page}
              onChange={(page) => updateParams({ page: page === 1 ? null : String(page) }, { keepPage: true })}
            />
          )}
        </Group>
      )}
    </Stack>
  );
}

type SortableHeaderProps = {
  column: SortColumn;
  label: string;
  sort: SortColumn;
  direction: Direction;
  onSort: (column: SortColumn) => void;
  align?: "left" | "right";
};

// A column header that sorts the list; aria-sort tells screen readers the order.
function SortableHeader({ column, label, sort, direction, onSort, align = "left" }: SortableHeaderProps) {
  const active = column === sort;
  const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";

  return (
    <Table.Th aria-sort={ariaSort} ta={align}>
      <UnstyledButton onClick={() => onSort(column)} fw={700} fz="sm">
        {label} {active ? (direction === "asc" ? "▲" : "▼") : ""}
      </UnstyledButton>
    </Table.Th>
  );
}
