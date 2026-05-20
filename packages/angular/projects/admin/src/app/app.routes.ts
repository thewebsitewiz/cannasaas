import { Routes } from '@angular/router';

import { adminBaselineGuard, authGuard } from './core/auth/auth.guard';

/**
 * Login is public. Everything else passes through `authGuard` +
 * `adminBaselineGuard` (super_admin / org_admin / dispensary_admin).
 * AdminLayout + the per-page lazy-loads land in sc-623 onward; for
 * now the protected branch shows a tiny "signed in" placeholder so
 * the auth flow is testable end-to-end.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canMatch: [authGuard, adminBaselineGuard],
    loadComponent: () => import('./pages/signed-in-placeholder').then((m) => m.SignedInPlaceholder),
  },
  { path: '**', redirectTo: '' },
];
