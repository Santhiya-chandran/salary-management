import "@mantine/core/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router";
import { App } from "../App";
import { theme } from "../theme";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element not found");

// Rendered by app/views/home/index.html.erb.
const userEmail = rootElement.dataset.userEmail ?? "";

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <App userEmail={userEmail} />
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
