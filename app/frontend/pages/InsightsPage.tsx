import { Stack, Tabs, Title } from "@mantine/core";
import { Outlet, useLocation, useNavigate } from "react-router";

export const INSIGHT_VIEWS = [
  { path: "by-country", label: "By country" },
  { path: "by-job-title", label: "By job title" },
  { path: "headcount", label: "Headcount" },
  { path: "usd-comparison", label: "USD comparison" },
] as const;

// Tabs for the four insight views. Each view has its own URL
// (/insights/by-country, ...), so views can be bookmarked and the back
// button works; the selected view renders in the Outlet.
export function InsightsPage() {
  const navigate = useNavigate();
  const view = useLocation().pathname.split("/")[2];

  return (
    <Stack gap="md">
      <Title order={2}>Insights</Title>
      <Tabs value={view} onChange={(next) => next && navigate(`/insights/${next}`)}>
        <Tabs.List>
          {INSIGHT_VIEWS.map((item) => (
            <Tabs.Tab key={item.path} value={item.path}>
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Outlet />
    </Stack>
  );
}
