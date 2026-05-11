import { Router } from 'express';
import { KPIController } from '../controllers/kpiController';

const router = Router();

// GET /api/kpis - Obtener todos los KPIs
router.get('/', KPIController.obtenerTodos);

// GET /api/kpis/:id - Obtener KPI por ID
router.get('/:id', KPIController.obtenerPorId);

export default router;
