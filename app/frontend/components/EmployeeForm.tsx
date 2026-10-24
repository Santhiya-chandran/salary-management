import { useState, type FormEvent, type ReactNode } from "react";
import { Alert, Autocomplete, Button, Group, Select, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { ValidationError } from "../lib/api";
import { employmentTypeLabel } from "../lib/format";
import type { Employee, EmploymentType, FilterOptions } from "../types";

// Every field is a string, exactly as sent to the API (salary included, so it
// never becomes a JavaScript number).
export type EmployeeFormValues = {
  full_name: string;
  job_title: string;
  department: string;
  country: string;
  currency: string;
  salary: string;
  employment_type: EmploymentType | "";
  hire_date: string;
};

export const emptyEmployeeValues: EmployeeFormValues = {
  full_name: "",
  job_title: "",
  department: "",
  country: "",
  currency: "",
  salary: "",
  employment_type: "",
  hire_date: "",
};

export function valuesFromEmployee(employee: Employee): EmployeeFormValues {
  const { full_name, job_title, department, country, currency, salary, employment_type, hire_date } = employee;
  return { full_name, job_title, department, country, currency, salary, employment_type, hire_date };
}

// Label, then input, then help text and error. With help text above the input
// (Mantine's default), a field with help text sits lower than a neighbour
// without, so inputs in the same row wouldn't line up.
const fieldLayout: { inputWrapperOrder: ("label" | "input" | "description" | "error")[] } = {
  inputWrapperOrder: ["label", "input", "description", "error"],
};

// "2,400,000.50" -> "2400000.50": people often type thousands separators.
export function toPayload(values: EmployeeFormValues): EmployeeFormValues {
  return { ...values, salary: values.salary.replace(/[,\s]/g, "") };
}

type EmployeeFormProps = {
  initialValues: EmployeeFormValues;
  options: FilterOptions | undefined;
  submitLabel: string;
  // Rejects with a ValidationError (shown next to the fields) or another error.
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  // Extra buttons shown beside submit, e.g. Cancel and Delete.
  actions?: ReactNode;
};

// Add and edit share this form. The server does the validating; its messages
// appear under the matching fields.
export function EmployeeForm({ initialValues, options, submitLabel, onSubmit, actions }: EmployeeFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  // Each country has one currency, so choosing a country sets it.
  function setCountry(code: string | null) {
    const country = options?.countries.find((option) => option.code === code);
    setValues((current) => ({ ...current, country: code ?? "", currency: country?.currency ?? "" }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(undefined);
    try {
      await onSubmit(toPayload(values));
    } catch (error) {
      if (error instanceof ValidationError) setErrors(error.errors);
      else setGeneralError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const errorFor = (key: keyof EmployeeFormValues) => errors[key]?.join(", ");

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md" maw={720}>
        <Text size="sm" c="dimmed">
          All fields are required.
        </Text>

        {generalError && (
          <Alert color="red" title="Couldn't save">
            {generalError}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            {...fieldLayout}
            label="Full name"
            value={values.full_name}
            onChange={(event) => set("full_name", event.currentTarget.value)}
            error={errorFor("full_name")}
          />
          <Autocomplete
            {...fieldLayout}
            label="Job title"
            description="Pick an existing title or type a new one"
            data={options?.job_titles ?? []}
            value={values.job_title}
            onChange={(value) => set("job_title", value)}
            error={errorFor("job_title")}
          />
          <Autocomplete
            {...fieldLayout}
            label="Department"
            description="Pick an existing department or type a new one"
            data={options?.departments ?? []}
            value={values.department}
            onChange={(value) => set("department", value)}
            error={errorFor("department")}
          />
          <Select
            {...fieldLayout}
            label="Country"
            placeholder="Choose a country"
            data={(options?.countries ?? []).map((country) => ({ value: country.code, label: country.name }))}
            value={values.country || null}
            onChange={setCountry}
            searchable
            error={errorFor("country")}
          />
          <TextInput
            {...fieldLayout}
            label="Currency"
            description="Set by the country"
            value={values.currency}
            readOnly
            error={errorFor("currency")}
          />
          <TextInput
            {...fieldLayout}
            label={values.currency ? `Salary (${values.currency})` : "Salary"}
            description="Annual, in the country's currency"
            inputMode="decimal"
            value={values.salary}
            onChange={(event) => set("salary", event.currentTarget.value)}
            error={errorFor("salary")}
          />
          <Select
            {...fieldLayout}
            label="Employment type"
            placeholder="Choose a type"
            data={(options?.employment_types ?? []).map((type) => ({ value: type, label: employmentTypeLabel(type) }))}
            value={values.employment_type || null}
            onChange={(value) => set("employment_type", (value ?? "") as EmploymentType | "")}
            error={errorFor("employment_type")}
          />
          <TextInput
            {...fieldLayout}
            label="Hire date"
            type="date"
            value={values.hire_date}
            onChange={(event) => set("hire_date", event.currentTarget.value)}
            error={errorFor("hire_date")}
          />
        </SimpleGrid>

        <Group justify="space-between">
          <Group gap="sm">
            <Button type="submit" loading={submitting}>
              {submitLabel}
            </Button>
            {actions}
          </Group>
        </Group>
      </Stack>
    </form>
  );
}
