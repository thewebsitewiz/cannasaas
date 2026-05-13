import { Routes } from '@angular/router';
import { dispensaryResolver } from './core/tenant/dispensary.resolver';

export const routes: Routes = [
  {
    path: '',
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
        path: 'express-checkout',
        loadChildren: () =>
          import('./features/express-checkout/express-checkout.routes').then(
            (m) => m.EXPRESS_CHECKOUT_ROUTES,
          ),
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
      },
      {
        path: 'account/verify',
        loadComponent: () =>
          import('./features/account/verify-age-page').then((m) => m.VerifyAgePage),
      },
      {
        path: 'account',
        loadComponent: () => import('./features/account/account-page').then((m) => m.AccountPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
