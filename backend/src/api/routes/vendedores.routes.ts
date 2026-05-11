import { Router } from 'express';
import { VendedorController } from '../controllers/vendedorController';

const router = Router();

// GET /api/vendedores - Obtener todos los vendedores
router.get('/', VendedorController.obtenerTodos);

// GET /api/vendedores/ranking/general - Ranking de vendedores
router.get('/ranking/general', VendedorController.obtenerRanking);

// GET /api/vendedores/:id - Obtener vendedor por ID
router.get('/:id', VendedorController.obtenerPorId);

// GET /api/vendedores/:id/estadisticas - Estadísticas del vendedor
router.get('/:id/estadisticas', VendedorController.obtenerEstadisticas);

export default router;
