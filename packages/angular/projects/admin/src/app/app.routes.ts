import { Routes } from '@angular/router';

import { adminBaselineGuard, authGuard } from './core/auth/auth.guard';

/**
 * Login is public. Everything else passes through `authGuard` +
 * `adminBaselineGuard` (super_admin / org_admin / dispensary_admin)
 * and renders inside `AdminLayout`. Per-page lazy-loads attach as
 * children of the layout route as they ship (sc-624 onward).
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canMatch: [authGuard, adminBaselineGuard],
    loadComponent: () => import('./layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'inventory-control',
        loadComponent: () =>
          import('./pages/inventory-control/inventory-control-page').then(
            (m) => m.InventoryControlPage,
          ),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders-page').then((m) => m.OrdersPage),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products-page').then((m) => m.ProductsPage),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory-page').then((m) => m.InventoryPage),
      },
      {
        path: 'compliance',
        loadComponent: () =>
          import('./pages/compliance/compliance-page').then((m) => m.CompliancePage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
  { path: '**', redirectTo: '' },
];
