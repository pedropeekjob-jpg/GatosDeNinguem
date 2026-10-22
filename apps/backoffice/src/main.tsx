import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@gn/ui/styles.css";
import "./backoffice.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
