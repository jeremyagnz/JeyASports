import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Calendario | JeyA Sports',
    loadComponent: () => import('./pages/schedule-page').then((m) => m.SchedulePage),
  },
];
