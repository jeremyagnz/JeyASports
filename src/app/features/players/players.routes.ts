import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Jugadoras | JeyA Sports',
    loadComponent: () => import('./pages/player-list-page').then((m) => m.PlayerListPage),
  },
  {
    path: 'roster',
    title: 'Roster | JeyA Sports',
    loadComponent: () => import('./pages/roster-page').then((m) => m.RosterPage),
  },
  {
    path: ':id',
    title: 'Perfil de jugadora | JeyA Sports',
    loadComponent: () => import('./pages/player-detail-page').then((m) => m.PlayerDetailPage),
  },
];
