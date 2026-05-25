import { Router } from 'express';
import {
  calcularComisionesVendedor,
  calcularComisionesMes,
  obtenerComisiones,
  obtenerComisionesAdmin,
  obtenerDetallesComision,
  obtenerResumen5Meses,
  obtenerTopVendedores,
  obtenerMisComisiones,
  obtenerMisClientes,
  obtenerClientesHistorico,
  obtenerMiResumen5Meses,
  recalcularAbril2026,
  recalcularMes,
  obtenerClientesIncumplidos,
  testCalcularAbril,
} from '../controllers/comisionController';
import { verificarToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/comisiones/calcular
 * Calcular comisiones para UN vendedor en UN mes específico
 */
router.post('/calcular', calcularComisionesVendedor);

/**
 * POST /api/comisiones/calcular-mes
 * Calcular comisiones para TODOS los vendedores en UN mes
 */
router.post('/calcular-mes', calcularComisionesMes);

/**
 * GET /api/comisiones?idAsesor=1&mes=2026-04-01
 * Obtener comisiones de un vendedor (opcionalmente filtrar por mes)
 */
router.get('/', obtenerComisiones);

/**
 * GET /api/comisiones/detalles/:idComision
 * Obtener detalles por cliente de una comisión
 */
router.get('/detalles/:idComision', obtenerDetallesComision);

/**
 * GET /api/comisiones/resumen/5-meses?idAsesor=1
 * Obtener resumen acumulado de últimos 5 meses (opcionalmente por vendedor)
 */
router.get('/resumen/5-meses', obtenerResumen5Meses);

/**
 * GET /api/comisiones/ranking/top-vendedores
 * Obtener top 10 vendedores del mes actual
 */
router.get('/ranking/top-vendedores', obtenerTopVendedores);

/**
 * RUTAS PROTEGIDAS - PARA EL VENDEDOR LOGUEADO
 */

/**
 * GET /api/comisiones/mis-comisiones
 * Obtener mis comisiones (del vendedor logueado)
 */
router.get('/mis-comisiones/todas', verificarToken, obtenerMisComisiones);

/**
 * GET /api/comisiones/mis-clientes
 * Obtener mis clientes (del vendedor logueado)
 */
router.get('/mis-clientes/lista', verificarToken, obtenerMisClientes);

/**
 * GET /api/comisiones/mis-clientes/historico
 * Obtener mis clientes de los últimos 5 meses (sin mes actual)
 */
router.get('/mis-clientes/historico', verificarToken, obtenerClientesHistorico);

/**
 * GET /api/comisiones/mi-resumen/5-meses
 * Obtener mi resumen de 5 meses (del vendedor logueado)
 */
router.get('/mi-resumen/5-meses', verificarToken, obtenerMiResumen5Meses);

/**
 * POST /api/comisiones/admin/recalcular/:mes
 * ADMIN: Recalcular comisiones de cualquier mes (formato YYYY-MM)
 */
router.post('/admin/recalcular/:mes', recalcularMes);

/**
 * GET /api/comisiones/admin/:idAsesor/:mes
 * ADMIN: Obtener comisiones de un vendedor específico (sin restricción de autenticación personal)
 */
router.get('/admin/:idAsesor/:mes', obtenerComisionesAdmin);

/** @deprecated — usar /admin/recalcular/2026-04 */
router.post('/admin/recalcular-abril-2026', recalcularAbril2026);

/**
 * GET /api/comisiones/incumplimientos/lista
 * Obtener clientes con incumplimientos del asesor autenticado
 * Requiere autenticacion
 */
router.get('/incumplimientos/lista', verificarToken, obtenerClientesIncumplidos);

/**
 * POST /api/comisiones/test/abril
 * TESTING: Calcula SOLO ABRIL para probar
 */
router.post('/test/abril', testCalcularAbril);

export default router;
