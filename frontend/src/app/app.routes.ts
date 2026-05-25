import { Routes } from '@angular/router';
import { canActivateAuth, canActivateAdmin } from './core/guards/auth.guard';

export const routes: Routes = [
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

    // DASHBOARD - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'dashboard',
      loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      canActivate: [canActivateAuth]
    },

    // HISTÓRICO - ÚLTIMOS 5 MESES - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'historico',
      loadComponent: () => import('./features/historico/historico.component').then(m => m.HistoricoComponent),
      canActivate: [canActivateAuth]
    },

    // COMISIONES - MES ACTUAL - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'comisiones',
      loadComponent: () => import('./features/comisiones/comisiones.component').then(m => m.ComisionesComponent),
      canActivate: [canActivateAuth]
    },

    // CLIENTES - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'clientes',
      loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
      canActivate: [canActivateAuth]
    },

    // INCUMPLIMIENTOS - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'incumplimientos',
      loadComponent: () => import('./features/incumplimientos/incumplimientos.component').then(m => m.IncumplimientosComponent),
      canActivate: [canActivateAuth]
    },

    // CLIENTES POR MES - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'clientes-grafica',
      loadComponent: () => import('./features/clientes/clientes-grafica/clientes-grafica.component').then(m => m.ClientesGraficaComponent),
      canActivate: [canActivateAuth]
    },

    // BONO VARIABLE - PROTEGIDO (SOLO VENDEDORES)
    {
      path: 'bono-variable',
      loadComponent: () => import('./features/bono-variable/bono-variable.component').then(m => m.BonoVariableComponent),
      canActivate: [canActivateAuth]
    },

    // VENDEDORES - PROTEGIDO (SOLO ADMIN)
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
