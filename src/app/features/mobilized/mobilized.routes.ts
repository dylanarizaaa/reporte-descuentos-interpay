import { Routes } from '@angular/router';
import { MfScope, provideMfScope } from '../../core/mf-scope/mf-scope';

export const routes: Routes = [
  {
    path: '',
    component: MfScope,
    providers: provideMfScope(),
    children: [
      {
        path: '',
        title: 'Movilizados por cliente',
        loadComponent: () => import('./mobilized').then((c) => c.Mobilized),
      },
    ],
  },
];

export default routes;
