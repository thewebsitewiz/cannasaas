import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'checkin',
    loadComponent: () =>
      import('./pages/check-in/check-in-page').then((m) => m.CheckInPage),
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('./pages/setup/setup-page').then((m) => m.SetupPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/kiosk-layout/kiosk-layout').then((m) => m.KioskLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/menu/menu-page').then((m) => m.MenuPage),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./pages/product/product-page').then((m) => m.ProductPage),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./pages/cart/cart-page').then((m) => m.CartPage),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./pages/checkout/checkout-page').then((m) => m.CheckoutPage),
      },
      {
        path: 'confirm/:orderId',
        loadComponent: () =>
          import('./pages/order-confirm/order-confirm-page').then(
            (m) => m.OrderConfirmPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
