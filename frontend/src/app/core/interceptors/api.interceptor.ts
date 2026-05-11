import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const apiInterceptor: HttpInterceptorFn = (
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener token
  const token = authService.getToken();

  // Agregar headers
  let modifiedRequest = request.clone({
    setHeaders: {
      'Content-Type': 'application/json'
    }
  });

  // Agregar token si existe
  if (token) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Error en interceptor:', error);
      
      if (error.status === 401) {
        console.error('No autorizado - redirigir a login');
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 500) {
        console.error('Error del servidor');
      }

      return throwError(() => error);
    })
  );
};
