import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Attempt token refresh (avoid infinite loop on refresh endpoint)
          if (!req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
            return authService.refreshToken().pipe(
              switchMap(authResponse => {
                const retryReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${authResponse.accessToken}`)
                });
                return next(retryReq);
              }),
              catchError(refreshError => {
                authService.logout();
                return throwError(() => refreshError);
              })
            );
          } else {
            authService.logout();
          }
          break;

        case 403:
          snackBar.open('Accès refusé. Vous n\'avez pas les permissions nécessaires.', 'Fermer', {
            duration: 5000,
            panelClass: ['snack-error']
          });
          break;

        case 404:
          // Handle silently or let component handle it
          break;

        case 422:
          // Validation errors - let components handle them
          break;

        case 500:
        case 502:
        case 503:
          snackBar.open('Erreur serveur. Veuillez réessayer plus tard.', 'Fermer', {
            duration: 5000,
            panelClass: ['snack-error']
          });
          break;

        default:
          if (error.status >= 500) {
            snackBar.open('Une erreur inattendue s\'est produite.', 'Fermer', {
              duration: 5000,
              panelClass: ['snack-error']
            });
          }
      }

      return throwError(() => error);
    })
  );
};
