import { Routes } from '@angular/router';
import { dispensaryScopedGuard } from './core/auth/dispensary-scoped.guard';

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
        path: '',
        pathMatch: 'full',
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
