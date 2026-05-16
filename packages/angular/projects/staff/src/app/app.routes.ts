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
    loadComponent: () =>
      import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  { path: '**', redirectTo: '' },
];
