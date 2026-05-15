import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  { path: '**', redirectTo: '' },
];
