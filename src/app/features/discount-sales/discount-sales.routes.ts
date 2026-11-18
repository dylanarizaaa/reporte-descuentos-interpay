import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Ventas con descuento',
    loadComponent: () =>
      import('./discount-sales').then((c) => c.DiscountSales),
  },
];

export default routes;