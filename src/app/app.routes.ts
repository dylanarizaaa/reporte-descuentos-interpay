import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'ventas-descuento',
        title: 'Ventas con descuento',
        loadComponent: () => import('./features/discount-sales/discount-sales').then(c => c.DiscountSales)
    },
];

export default routes;