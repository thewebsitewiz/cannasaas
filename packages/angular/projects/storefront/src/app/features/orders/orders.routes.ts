import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./order-tracking-page').then((m) => m.OrderTrackingPage),
  },
];
