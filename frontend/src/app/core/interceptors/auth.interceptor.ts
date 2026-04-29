import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.clearSession();
        router.navigate(['/auth/login']);
        snackBar.open('Sitzung abgelaufen. Bitte erneut anmelden.', 'OK', { duration: 5000 });
      } else if (error.status === 0) {
        snackBar.open('Server nicht erreichbar.', 'OK', { duration: 5000 });
      } else {
        snackBar.open(`Fehler: ${error.message}`, 'OK', { duration: 5000 });
      }
      return throwError(() => error);
    })
  );
};
