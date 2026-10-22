import type { ReactNode } from "react";
import { render as testingLibraryRender } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { theme } from "../theme";

// Every Mantine component needs a MantineProvider above it.
export function render(ui: ReactNode) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    ),
  });
}
