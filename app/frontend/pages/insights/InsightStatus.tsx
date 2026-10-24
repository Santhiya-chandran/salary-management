import type { ReactNode } from "react";
import { Alert, Loader, Text } from "@mantine/core";

type InsightStatusProps = {
  loading: boolean;
  error: string | undefined;
  empty: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

// Loading, error and empty states shared by the insight views.
export function InsightStatus({ loading, error, empty, emptyMessage = "No employees yet.", children }: InsightStatusProps) {
  if (error) {
    return (
      <Alert color="red" title="Couldn't load this insight">
        {error}
      </Alert>
    );
  }
  if (loading) return <Loader aria-label="Loading" />;
  if (empty) return <Text c="dimmed">{emptyMessage}</Text>;
  return <>{children}</>;
}
