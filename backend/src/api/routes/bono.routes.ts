import { Router } from 'express';
import multer from 'multer';
import { BonoController } from '../controllers/bonoController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Prospectos
router.post('/prospectos/importar', upload.single('archivo'), BonoController.importarProspectos);
router.get('/prospectos/porcentaje/:id_asesor', BonoController.getPorcentajeProspeccion);
router.get('/prospectos/:id_asesor', BonoController.obtenerProspectos);

// Llamadas de calidad
router.post('/llamadas/importar', upload.single('archivo'), BonoController.importarLlamadas);
router.get('/llamadas/lista/:id_asesor', BonoController.obtenerLlamadas);
router.get('/llamadas/porcentaje/:id_asesor', BonoController.getPorcentajeLlamadas);

// Sincronizar llamadas desde Google Sheets
router.post('/sincronizar/llamadas-sheets', BonoController.sincronizarLlamadasSheets);

// Sincronizar prospectos + llamadas desde Google Sheets
router.post('/sincronizar/sheets', BonoController.sincronizarTodoSheets);

// Bono total
router.get('/total/:id_asesor', BonoController.getBonoTotal);

// DEBUG
router.get('/debug/prospectos-sheets', BonoController.debugProspectosSheets);

export default router;
