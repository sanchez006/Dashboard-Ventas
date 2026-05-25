import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { verificarToken, esAdmin } from '../middleware/authMiddleware';

const router = Router();

/**
 * RUTAS DE ADMIN
 * Todas requieren: Token válido + Rol Admin
 */

// GET /api/admin/dashboard-resumen
// Resumen general de todos los vendedores
router.get(
  '/dashboard-resumen',
  verificarToken,
  esAdmin,
  AdminController.obtenerResumenGlobal
);

// GET /api/admin/vendedores-detalle
// Obtener todos los vendedores con detalles
router.get(
  '/vendedores-detalle',
  verificarToken,
  esAdmin,
  AdminController.obtenerVendedoresDetalle
);

// GET /api/admin/ranking-vendedores
// Ranking de vendedores por ventas
router.get(
  '/ranking-vendedores',
  verificarToken,
  esAdmin,
  AdminController.obtenerRankingVendedores
);

// GET /api/admin/comisiones-mes/:mes
// Comisiones de todos los vendedores en un mes (mes = YYYY-MM)
router.get(
  '/comisiones-mes/:mes',
  verificarToken,
  esAdmin,
  AdminController.obtenerComisionesMes
);

// GET /api/admin/resumen-mes/:mes
// Resumen agregado de un mes específico
router.get(
  '/resumen-mes/:mes',
  verificarToken,
  esAdmin,
  AdminController.obtenerResumenMes
);

// GET /api/admin/vendedor/:id/comisiones-mes/:mes
// Comisiones de un vendedor específico en un mes
router.get(
  '/vendedor/:id/comisiones-mes/:mes',
  verificarToken,
  esAdmin,
  AdminController.obtenerComisionesVendedor
);

// GET /api/admin/todos-clientes
// Todos los clientes de todos los vendedores (con paginación)
// Query params: limit, offset, mes (opcional)
router.get(
  '/todos-clientes',
  verificarToken,
  esAdmin,
  AdminController.obtenerTodosClientes
);

// GET /api/admin/vendedor/:id/clientes/:mes
// Clientes de un vendedor específico en un mes
router.get(
  '/vendedor/:id/clientes/:mes',
  verificarToken,
  esAdmin,
  AdminController.obtenerClientesVendedor
);

export default router;
