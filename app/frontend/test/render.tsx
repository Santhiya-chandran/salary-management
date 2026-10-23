import type { ReactNode } from "react";
import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { MemoryRouter } from "react-router";
import { theme } from "../theme";

type Options = {
  // The URL the in-memory router starts at, e.g. "/employees?country=IN".
  route?: string;
};

// Every Mantine component needs a MantineProvider above it, and pages need a
// router; MemoryRouter keeps navigation inside the test.
export function render(ui: ReactNode, { route = "/" }: Options = {}) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MantineProvider theme={theme} env="test">
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </MantineProvider>
    ),
  });
}
