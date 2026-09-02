import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Estadísticas | JeyA Sports',
    loadComponent: () => import('./pages/team-stats-page').then((m) => m.TeamStatsPage),
  },
  {
    path: 'compare',
    title: 'Comparar | JeyA Sports',
    loadComponent: () => import('./pages/stat-compare-page').then((m) => m.StatComparePage),
  },
];
