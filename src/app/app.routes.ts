import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'ventas-descuento',
    title: 'Ventas con descuento',
    loadComponent: () =>
      import('./features/discount-sales/discount-sales').then((c) => c.DiscountSales),
  },
  {
    path: 'movilizados-cliente',
    title: 'Movilizados por cliente',
    loadComponent: () => import('./features/mobilized/mobilized').then((c) => c.Mobilized),
  },
];

export default routes;
