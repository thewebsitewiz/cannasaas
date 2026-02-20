/**
 * PASTE THIS into apps/staff/src/main.jsx
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider, AuthProvider, MutationStatusToaster } from "@cannasaas/api-client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <MutationStatusToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);

