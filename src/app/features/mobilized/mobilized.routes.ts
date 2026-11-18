import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Movilizados por cliente',
    loadComponent: () => import('./mobilized').then((c) => c.Mobilized),
  },
];

export default routes;
