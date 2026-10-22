import { AppShell, Button, Group, Text, Title } from "@mantine/core";
import { csrfToken } from "./lib/csrf";

type AppProps = {
  userEmail: string;
};

export function App({ userEmail }: AppProps) {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={1} size="h3">
            Salary Management
          </Title>

          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {userEmail}
            </Text>
            {/* A plain form so Rails handles sign-out exactly as it does for the login page. */}
            <form method="post" action="/session">
              <input type="hidden" name="_method" value="delete" />
              <input type="hidden" name="authenticity_token" value={csrfToken()} />
              <Button type="submit" variant="default" size="xs">
                Sign out
              </Button>
            </form>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Text>Employees and salary insights are coming soon.</Text>
      </AppShell.Main>
    </AppShell>
  );
}
