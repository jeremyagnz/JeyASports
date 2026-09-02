import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Perfil del equipo | JeyA Sports',
    loadComponent: () => import('./pages/team-profile-page').then((m) => m.TeamProfilePage),
  },
  {
    path: 'venues',
    title: 'Sedes | JeyA Sports',
    loadComponent: () => import('./pages/venues-page').then((m) => m.VenuesPage),
  },
  {
    path: 'opponents',
    title: 'Rivales | JeyA Sports',
    loadComponent: () => import('./pages/opponents-page').then((m) => m.OpponentsPage),
  },
];
