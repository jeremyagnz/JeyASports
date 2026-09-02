import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Líderes | JeyA Sports',
    loadComponent: () => import('./pages/leaders-page').then((m) => m.LeadersPage),
  },
  {
    path: ':category',
    title: 'Líderes | JeyA Sports',
    loadComponent: () => import('./pages/leader-detail-page').then((m) => m.LeaderDetailPage),
  },
];
