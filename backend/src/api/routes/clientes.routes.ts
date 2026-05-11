
import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController';

const router = Router();

// GET /api/clientes/por-mes/:id_asesor - Totales de clientes por mes desde diciembre 2025 para un asesor
router.get('/por-mes/:id_asesor', ClienteController.obtenerTotalesPorMesDesdeDiciembre2025);

// GET /api/clientes - Obtener todos los clientes
router.get('/', ClienteController.obtenerTodos);

// GET /api/clientes/:id - Obtener cliente por ID
router.get('/:id', ClienteController.obtenerPorId);

// GET /api/clientes/estado/:estado - Clientes por estado
router.get('/estado/:estado', ClienteController.obtenerPorEstado);

// GET /api/clientes/alertas/vencimientos - Próximos vencimientos
router.get('/alertas/vencimientos', ClienteController.obtenerProximosVencimientos);

// GET /api/clientes/resumen/por-estado - Resumen por estado
router.get('/resumen/por-estado', ClienteController.obtenerResumenPorEstado);

export default router;
