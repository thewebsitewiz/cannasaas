import { Routes } from '@angular/router';

export const EXPRESS_CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./express-checkout-page').then((m) => m.ExpressCheckoutPage),
  },
];
