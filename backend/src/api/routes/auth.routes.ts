import { Router } from 'express';
import {
  login,
  registrar,
  cambiarPassword,
  me,
} from '../controllers/authController';
import { verificarToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/auth/login
 * Endpoint público - Login con email y contraseña
 * Body: { email, password }
 * Retorna: { token, usuario }
 */
router.post('/login', login);

/**
 * POST /api/auth/registrar
 * Endpoint para crear nuevos usuarios (idealmente solo admin)
 * Body: { nombre, email, password, rol, id_asesor }
 */
router.post('/registrar', registrar);

/**
 * GET /api/auth/me
 * Endpoint protegido - Obtener datos del usuario actual
 * Header: Authorization: Bearer <token>
 */
router.get('/me', verificarToken, me);

/**
 * POST /api/auth/cambiar-password
 * Endpoint protegido - Cambiar contraseña
 * Header: Authorization: Bearer <token>
 * Body: { passwordAntigua, passwordNueva }
 */
router.post('/cambiar-password', verificarToken, cambiarPassword);

export default router;
