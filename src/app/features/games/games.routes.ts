import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Juegos | JeyA Sports',
    loadComponent: () => import('./pages/game-list-page').then((m) => m.GameListPage),
  },
  {
    path: ':id',
    title: 'Detalle del juego | JeyA Sports',
    loadComponent: () => import('./pages/game-detail-page').then((m) => m.GameDetailPage),
  },
  {
    path: ':id/live',
    canActivate: [roleGuard('OWNER', 'ADMIN')],
    title: 'Game day | JeyA Sports',
    loadComponent: () => import('../game-day/pages/game-day-page').then((m) => m.GameDayPage),
  },
];
