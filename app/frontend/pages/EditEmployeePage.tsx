import { useState } from "react";
import { Alert, Button, Group, Loader, Modal, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate, useParams } from "react-router";
import { EmployeeForm, valuesFromEmployee, type EmployeeFormValues } from "../components/EmployeeForm";
import { apiSend } from "../lib/api";
import { useApiGet } from "../lib/useApiGet";
import type { Employee, FilterOptions } from "../types";
import { useEmployeeListUrl } from "./employeeListLink";

// Edits overwrite the current values, including salary; no history is kept (v1).
export function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listUrl = useEmployeeListUrl();
  const loaded = useApiGet<{ employee: Employee }>(`/api/employees/${id}`);
  const options = useApiGet<FilterOptions>("/api/employees/filters");
  const [confirmOpen, confirm] = useDisclosure(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, setDeleting] = useState(false);

  const employee = loaded.data?.employee;

  async function save(values: EmployeeFormValues) {
    const { employee: saved } = await apiSend<{ employee: Employee }>("PATCH", `/api/employees/${id}`, {
      employee: values,
    });
    navigate(listUrl, { state: { flash: `${saved.full_name} was updated.` } });
  }

  async function destroy() {
    if (!employee) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await apiSend("DELETE", `/api/employees/${id}`);
      navigate(listUrl, { state: { flash: `${employee.full_name} was deleted.` } });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  const cancel = (
    <Button component={Link} to={listUrl} variant="default">
      Cancel
    </Button>
  );

  return (
    <Stack gap="md">
      <Title order={2}>Edit employee</Title>

      {loaded.loading && !employee && <Loader aria-label="Loading employee" />}

      {loaded.error && (
        <Alert color="red" title="Couldn't load this employee">
          {loaded.error}
        </Alert>
      )}

      {employee && (
        <EmployeeForm
          key={employee.id}
          initialValues={valuesFromEmployee(employee)}
          options={options.data}
          submitLabel="Save changes"
          onSubmit={save}
          actions={
            <>
              {cancel}
              <Button color="red" variant="light" onClick={confirm.open}>
                Delete employee
              </Button>
            </>
          }
        />
      )}

      <Modal opened={confirmOpen} onClose={confirm.close} title="Delete employee" centered>
        <Stack gap="md">
          <Text>Delete {employee?.full_name}? This can't be undone.</Text>
          {deleteError && <Alert color="red">{deleteError}</Alert>}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={confirm.close}>
              Cancel
            </Button>
            <Button color="red" onClick={destroy} loading={deleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
