import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole: UserRole = route.data['role'];
  const userRole = authService.getRole();

  if (!requiredRole || userRole === requiredRole || userRole === UserRole.ADMIN) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
