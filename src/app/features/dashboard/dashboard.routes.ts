import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Panel | JeyA Sports',
    loadComponent: () => import('./pages/dashboard-page').then((m) => m.DashboardPage),
  },
];
