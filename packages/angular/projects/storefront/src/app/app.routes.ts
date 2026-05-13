import { Routes } from '@angular/router';
import { ageVerifiedGuard } from './core/age-gate/age-verified-guard';
import { dispensaryResolver } from './core/tenant/dispensary.resolver';

export const routes: Routes = [
  {
    path: 'age-gate',
    loadComponent: () => import('./pages/age-gate/age-gate-page').then((m) => m.AgeGatePage),
  },
  {
    path: '',
    canMatch: [ageVerifiedGuard],
    resolve: { dispensary: dispensaryResolver },
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
      },
      {
        path: 'cart',
        loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
      },
      // Feature routes land here as they migrate. Each lazy-loads its own
      // route table:
      // { path: 'account',  loadChildren: () => import('./features/account/account.routes').then(m => m.ACCOUNT_ROUTES) },
      // { path: 'login',    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
    ],
  },
  { path: '**', redirectTo: '' },
];
