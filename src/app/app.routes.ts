import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register-pharmacy',
        loadComponent: () =>
          import('./features/auth/pharmacy-register/pharmacy-register.component').then(
            m => m.PharmacyRegisterComponent
          )
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: UserRole.PHARMACY_STAFF }
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./features/stock/stock.component').then(m => m.StockComponent),
        canActivate: [authGuard]
      },
      {
        path: 'reservations',
        loadComponent: () =>
          import('./features/reservations/reservations.component').then(m => m.ReservationsComponent),
        canActivate: [authGuard]
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard]
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: UserRole.ADMIN }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
