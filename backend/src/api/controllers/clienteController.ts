import { Request, Response } from 'express';
import { ClienteService } from '../../services/clienteService';

export class ClienteController {

    // GET /api/clientes/por-mes/:id_asesor
    static async obtenerTotalesPorMesDesdeDiciembre2025(req: Request, res: Response) {
      try {
        const idAsesor = parseInt(req.params.id_asesor);
        if (isNaN(idAsesor)) {
          return res.status(400).json({ success: false, error: 'id_asesor inválido' });
        }
        const datos = await ClienteService.obtenerTotalesPorMesDesdeDiciembre2025(idAsesor);
        res.json({ success: true, data: datos });
      } catch (error) {
        console.error('Error en obtenerTotalesPorMesDesdeDiciembre2025:', error);
        res.status(500).json({ success: false, error: 'Error al obtener totales por mes' });
      }
    }
  
  // GET /api/clientes
  static async obtenerTodos(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const clientes = await ClienteService.obtenerTodos(limit, offset);
      const total = await ClienteService.contar();

      res.json({
        success: true,
        data: clientes,
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      res.status(500).json({ success: false, error: 'Error al obtener clientes' });
    }
  }

  // GET /api/clientes/:id
  static async obtenerPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cliente = await ClienteService.obtenerPorId(parseInt(id));

      if (!cliente) {
        return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      }

      res.json({ success: true, data: cliente });
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      res.status(500).json({ success: false, error: 'Error al obtener cliente' });
    }
  }

  // GET /api/clientes/estado/:estado
  static async obtenerPorEstado(req: Request, res: Response) {
    try {
      const { estado } = req.params;
      const clientes = await ClienteService.obtenerPorEstado(estado);

      res.json({
        success: true,
        data: clientes,
        count: clientes.length
      });
    } catch (error) {
      console.error('Error en obtenerPorEstado:', error);
      res.status(500).json({ success: false, error: 'Error al obtener clientes por estado' });
    }
  }

  // GET /api/clientes/alertas/vencimientos
  static async obtenerProximosVencimientos(req: Request, res: Response) {
    try {
      const dias = parseInt(req.query.dias as string) || 30;
      const clientes = await ClienteService.obtenerProximosVencimientos(dias);

      res.json({
        success: true,
        data: clientes,
        count: clientes.length,
        mensaje: `Clientes con vencimiento en próximos ${dias} días`
      });
    } catch (error) {
      console.error('Error en obtenerProximosVencimientos:', error);
      res.status(500).json({ success: false, error: 'Error al obtener próximos vencimientos' });
    }
  }

  // GET /api/clientes/resumen/por-estado
  static async obtenerResumenPorEstado(req: Request, res: Response) {
    try {
      const resumen = await ClienteService.obtenerResumenPorEstado();

      res.json({
        success: true,
        data: resumen
      });
    } catch (error) {
      console.error('Error en obtenerResumenPorEstado:', error);
      res.status(500).json({ success: false, error: 'Error al obtener resumen' });
    }
  }
}
