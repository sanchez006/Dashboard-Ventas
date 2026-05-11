import { Request, Response, NextFunction } from 'express';
import authService from '../../services/authService';

/**
 * Middleware para verificar JWT
 * Extrae el token del header Authorization
 * Si es válido, agrega los datos al request
 * Si no es válido, retorna error 401
 */
export const verificarToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token no proporcionado',
      });
    }

    // 2. Extraer token (formato: "Bearer <token>")
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Formato inválido. Use: Authorization: Bearer <token>',
      });
    }

    // 3. Verificar token
    const decoded = authService.verificarToken(token);

    // 4. Agregar datos al request
    (req as any).usuario = decoded;

    // 5. Continuar
    next();
  } catch (error: any) {
    return res.status(401).json({
      error: error.message || 'Token inválido',
    });
  }
};

/**
 * Middleware para verificar que el usuario es ADMIN
 */
export const esAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (usuario.rol !== 'admin') {
      return res.status(403).json({
        error: 'Solo administradores pueden acceder',
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
};

/**
 * Middleware para verificar que el usuario es VENDEDOR
 */
export const esVendedor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (usuario.rol !== 'vendedor' && usuario.rol !== 'admin') {
      return res.status(403).json({
        error: 'Solo vendedores pueden acceder',
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
};
