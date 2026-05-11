import { Routes } from '@angular/router';
import { canActivateAuth, canActivateAdmin } from './core/guards/auth.guard';

export const routes: Routes = [
    // BONO VARIABLE - PROTEGIDO
    {
      path: 'bono-variable',
      loadComponent: () => import('./features/bono-variable/bono-variable.component').then(m => m.BonoVariableComponent),
      canActivate: [canActivateAuth]
    },
    // CLIENTES POR MES - PROTEGIDO
    {
      path: 'clientes-grafica',
      loadComponent: () => import('./features/clientes/clientes-grafica/clientes-grafica.component').then(m => m.ClientesGraficaComponent),
      canActivate: [canActivateAuth]
    },
  // RUTA POR DEFECTO - SIEMPRE A LOGIN
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  
  // LOGIN - SIN PROTECCIÓN
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },

  // DASHBOARD - PROTEGIDO
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [canActivateAuth]
  },

  // HISTÓRICO - ÚLTIMOS 5 MESES - PROTEGIDO
  {
    path: 'historico',
    loadComponent: () => import('./features/historico/historico.component').then(m => m.HistoricoComponent),
    canActivate: [canActivateAuth]
  },

  // COMISIONES - MES ACTUAL - PROTEGIDO
  {
    path: 'comisiones',
    loadComponent: () => import('./features/comisiones/comisiones.component').then(m => m.ComisionesComponent),
    canActivate: [canActivateAuth]
  },

  // CLIENTES - PROTEGIDO
  {
    path: 'clientes',
    loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
    canActivate: [canActivateAuth]
  },

  // INCUMPLIMIENTOS - PROTEGIDO
  {
    path: 'incumplimientos',
    loadComponent: () => import('./features/incumplimientos/incumplimientos.component').then(m => m.IncumplimientosComponent),
    canActivate: [canActivateAuth]
  },

  // VENDEDORES (SOLO ADMIN) - PROTEGIDO
  {
    path: 'vendedores',
    loadComponent: () => import('./features/vendedores/vendedores.component').then(m => m.VendedoresComponent),
    canActivate: [canActivateAdmin]
  },

  // CATCH-ALL - REDIRIGIR A LOGIN
  {
    path: '**',
    redirectTo: '/login'
  }
];
