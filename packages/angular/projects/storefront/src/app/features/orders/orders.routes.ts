import { Routes } from '@angular/router';
import { authRequiredGuard } from '../../core/auth/auth-required-guard';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [authRequiredGuard],
    loadComponent: () => import('./orders-list-page').then((m) => m.OrdersListPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./order-tracking-page').then((m) => m.OrderTrackingPage),
  },
];
