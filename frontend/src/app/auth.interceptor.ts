import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);

  let requestToForward = req;
  if (token) {
    requestToForward = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(requestToForward).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn(
          'Erro 401 detectado: Limpando token e redirecionando para o login...',
        );
        localStorage.removeItem('access_token');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
