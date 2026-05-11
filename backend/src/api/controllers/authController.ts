import { Request, Response } from 'express';
import authService from '../../services/authService';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log(`\n📥 [CONTROLLER LOGIN] Recibido request: email=${email}`);

    if (!email || !password) {
      console.log(`⚠️  [CONTROLLER LOGIN] Falta email o password`);
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
      });
    }

    const resultado = await authService.login(email, password);

    console.log(`✅ [CONTROLLER LOGIN] Login exitoso: ${resultado.usuario.nombre}`);

    res.json({
      success: true,
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error: any) {
    console.error(`❌ [CONTROLLER LOGIN ERROR]:`, error.message);
    res.status(401).json({
      error: error.message || 'Error en login',
    });
  }
};

export const registrar = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol, id_asesor } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y contraseña son requeridos',
      });
    }

    const usuario = await authService.registrarUsuario(
      nombre,
      email,
      password,
      rol || 'vendedor',
      id_asesor
    );

    res.status(201).json({
      success: true,
      usuario,
    });
  } catch (error: any) {
    console.error('Error registrando usuario:', error);
    res.status(400).json({
      error: error.message || 'Error registrando usuario',
    });
  }
};

export const cambiarPassword = async (req: Request, res: Response) => {
  try {
    const { passwordAntigua, passwordNueva } = req.body;
    const idUsuario = (req as any).usuario?.id;

    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!passwordAntigua || !passwordNueva) {
      return res.status(400).json({
        error: 'Contraseña antigua y nueva son requeridas',
      });
    }

    await authService.cambiarPassword(idUsuario, passwordAntigua, passwordNueva);

    res.json({
      success: true,
      mensaje: 'Contraseña cambiada exitosamente',
    });
  } catch (error: any) {
    console.error('Error cambiando contraseña:', error);
    res.status(400).json({
      error: error.message || 'Error cambiando contraseña',
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    res.json({
      success: true,
      usuario,
    });
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    res.status(500).json({ error: 'Error obteniendo datos' });
  }
};
