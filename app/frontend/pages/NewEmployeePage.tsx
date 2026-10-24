import { Button, Stack, Title } from "@mantine/core";
import { Link, useNavigate } from "react-router";
import { EmployeeForm, emptyEmployeeValues, type EmployeeFormValues } from "../components/EmployeeForm";
import { apiSend } from "../lib/api";
import { useApiGet } from "../lib/useApiGet";
import type { Employee, FilterOptions } from "../types";
import { useEmployeeListUrl } from "./employeeListLink";

export function NewEmployeePage() {
  const navigate = useNavigate();
  const listUrl = useEmployeeListUrl();
  const options = useApiGet<FilterOptions>("/api/employees/filters");

  async function create(values: EmployeeFormValues) {
    const { employee } = await apiSend<{ employee: Employee }>("POST", "/api/employees", { employee: values });
    navigate(listUrl, { state: { flash: `${employee.full_name} was added.` } });
  }

  return (
    <Stack gap="md">
      <Title order={2}>Add employee</Title>
      <EmployeeForm
        initialValues={emptyEmployeeValues}
        options={options.data}
        submitLabel="Add employee"
        onSubmit={create}
        actions={
          <Button component={Link} to={listUrl} variant="default">
            Cancel
          </Button>
        }
      />
    </Stack>
  );
}
