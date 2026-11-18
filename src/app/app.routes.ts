import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'ventas-descuento',
        loadChildren: () => import('./features/discount-sales/discount-sales.routes').then(m => m.routes)
    },
    {
        path: 'movilizados-cliente',
        loadChildren: () => import('./features/mobilized/mobilized.routes').then(m => m.routes)
    },
];
