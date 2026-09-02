import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Miembros | JeyA Sports',
    loadComponent: () => import('./pages/members-page').then((m) => m.MembersPage),
  },
  {
    path: 'data',
    title: 'Herramientas de datos | JeyA Sports',
    loadComponent: () => import('./pages/data-tools-page').then((m) => m.DataToolsPage),
  },
];
