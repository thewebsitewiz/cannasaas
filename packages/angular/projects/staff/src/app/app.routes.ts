import { Routes } from '@angular/router';
import { dispensaryScopedGuard } from './core/auth/dispensary-scoped.guard';
import { registerSessionGuard } from './core/register-session/register-session.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canMatch: [dispensaryScopedGuard],
    loadComponent: () => import('./layout/staff-shell').then((m) => m.StaffShell),
    children: [
      {
        path: 'register/open',
        loadComponent: () =>
          import('./pages/register-open/register-open-page').then((m) => m.RegisterOpenPage),
      },
      {
        path: 'register/close',
        loadComponent: () =>
          import('./pages/register-close/register-close-page').then((m) => m.RegisterClosePage),
      },
      {
        path: '',
        pathMatch: 'full',
        canMatch: [registerSessionGuard],
        loadComponent: () =>
          import('./features/new-order/new-order-page').then((m) => m.NewOrderPage),
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/order-queue/order-queue-page').then((m) => m.OrderQueuePage),
      },
      {
        path: 'timesheets',
        loadComponent: () =>
          import('./features/timesheets/timesheets-page').then((m) => m.TimesheetsPage),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-page').then((m) => m.InventoryPage),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/product-lookup/product-lookup-page').then((m) => m.ProductLookupPage),
      },
      {
        path: 'fulfillment',
        loadComponent: () =>
          import('./features/fulfillment/fulfillment-page').then((m) => m.FulfillmentPage),
      },
      {
        path: 'placeholder',
        loadComponent: () =>
          import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
