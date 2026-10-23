import { AppShell, Burger, Button, Group, NavLink, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavLink as RouterNavLink, Outlet, useLocation } from "react-router";
import { csrfToken } from "../lib/csrf";

const NAV_ITEMS = [
  { to: "/employees", label: "Employees" },
  { to: "/insights", label: "Insights" },
];

type AppLayoutProps = {
  userEmail: string;
};

// Header and side navigation around every page. On small screens the
// navigation collapses behind the burger button.
export function AppLayout({ userEmail }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 200, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            <Title order={1} size="h3">
              Salary Management
            </Title>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm">
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

      <AppShell.Navbar p="xs" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            component={RouterNavLink}
            to={item.to}
            label={item.label}
            active={pathname.startsWith(item.to)}
            onClick={close}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
