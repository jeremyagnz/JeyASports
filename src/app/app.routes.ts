import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { teamGuard } from './core/guards/team.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Iniciar sesión | JeyA Sports',
    loadComponent: () => import('./features/auth/pages/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'select-team',
    canActivate: [authGuard],
    title: 'Elegir equipo | JeyA Sports',
    loadComponent: () =>
      import('./features/auth/pages/team-select-page').then((m) => m.TeamSelectPage),
  },
  {
    path: 'app',
    canActivate: [authGuard, teamGuard],
    loadComponent: () => import('./layout/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.routes),
      },
      {
        path: 'players',
        loadChildren: () => import('./features/players/players.routes').then((m) => m.routes),
      },
      {
        path: 'stats',
        loadChildren: () => import('./features/stats/stats.routes').then((m) => m.routes),
      },
      {
        path: 'leaders',
        loadChildren: () => import('./features/leaders/leaders.routes').then((m) => m.routes),
      },
      {
        path: 'schedule',
        loadChildren: () => import('./features/schedule/schedule.routes').then((m) => m.routes),
      },
      {
        path: 'games',
        loadChildren: () => import('./features/games/games.routes').then((m) => m.routes),
      },
      {
        path: 'seasons',
        canActivate: [roleGuard('OWNER', 'ADMIN')],
        loadChildren: () => import('./features/seasons/seasons.routes').then((m) => m.routes),
      },
      {
        path: 'team-settings',
        canActivate: [roleGuard('OWNER', 'ADMIN')],
        loadChildren: () =>
          import('./features/team-settings/team-settings.routes').then((m) => m.routes),
      },
      {
        path: 'administration',
        canActivate: [roleGuard('OWNER')],
        loadChildren: () =>
          import('./features/administration/administration.routes').then((m) => m.routes),
      },
    ],
  },
  {
    path: '403',
    title: 'Sin permisos | JeyA Sports',
    loadComponent: () => import('./features/auth/pages/forbidden-page').then((m) => m.ForbiddenPage),
  },
  {
    path: '**',
    title: 'Página no encontrada | JeyA Sports',
    loadComponent: () => import('./features/auth/pages/not-found-page').then((m) => m.NotFoundPage),
  },
];
