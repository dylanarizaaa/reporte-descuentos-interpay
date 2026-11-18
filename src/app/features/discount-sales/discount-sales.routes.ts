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
        title: 'Ventas con descuento',
        loadComponent: () => import('./discount-sales').then((c) => c.DiscountSales),
      },
    ],
  },
];

export default routes;
