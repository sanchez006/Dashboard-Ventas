import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas - Solo usuarios autenticados
 */
export const canActivateAuth: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Verificar si hay token en localStorage
  const token = localStorage.getItem('token');
  
  if (token && authService.estaLogueado()) {
    console.log('✅ Usuario autenticado, permitir acceso');
    return true;
  }

  console.log('❌ Usuario NO autenticado, redirigir a login');
  // Si no está logueado, redirigir a login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

/**
 * Guard para solo admins
 */
export const canActivateAdmin: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  
  if (token && authService.esAdmin()) {
    console.log('✅ Admin permitido');
    return true;
  }

  console.log('❌ No es admin, redirigir a dashboard');
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard para solo vendedores
 */
export const canActivateVendedor: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  
  if (token && authService.esVendedor()) {
    console.log('✅ Vendedor permitido');
    return true;
  }

  console.log('❌ No es vendedor, redirigir a login');
  router.navigate(['/login']);
  return false;
};
