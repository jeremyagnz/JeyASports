import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Temporadas | JeyA Sports',
    loadComponent: () => import('./pages/season-list-page').then((m) => m.SeasonListPage),
  },
];
