import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },
      {
        path: 'location',
        canActivate: [authGuard],
        loadChildren: () => import('./features/location/location.routes').then(m => m.LOCATION_ROUTES)
      },
      {
        path: 'monitoring',
        canActivate: [authGuard],
        loadChildren: () => import('./features/monitoring/monitoring.routes').then(m => m.MONITORING_ROUTES)
      },
      { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
