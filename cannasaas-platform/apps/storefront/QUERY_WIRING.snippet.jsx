/**
 * PASTE THIS into apps/storefront/src/main.jsx
 * or wrap your existing <App /> in these providers.
 *
 * Order matters:
 *   QueryProvider (outermost — AuthProvider uses React Query)
 *   └─ AuthProvider (reads/writes auth cache)
 *      └─ BrowserRouter
 *         └─ App
 *            └─ MutationStatusToaster (at app root, outside routes)
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryProvider,
  AuthProvider,
  MutationStatusToaster,
} from "@cannasaas/api-client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          {/* Toast notifications for all mutations — renders at DOM root */}
          <MutationStatusToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);

