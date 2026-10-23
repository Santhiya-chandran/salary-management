import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <Stack gap="xs">
      <Title order={2}>Page not found</Title>
      <Text>
        <Anchor component={Link} to="/employees">
          Go to the employee list
        </Anchor>
      </Text>
    </Stack>
  );
}
