import { Request, Response } from 'express';
import { VendedorService } from '../../services/vendedorService';

export class VendedorController {
  
  // GET /api/vendedores
  static async obtenerTodos(req: Request, res: Response) {
    try {
      const vendedores = await VendedorService.obtenerTodos();

      res.json({
        success: true,
        data: vendedores,
        count: vendedores.length
      });
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      res.status(500).json({ success: false, error: 'Error al obtener vendedores' });
    }
  }

  // GET /api/vendedores/:id
  static async obtenerPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendedor = await VendedorService.obtenerPorId(parseInt(id));

      if (!vendedor) {
        return res.status(404).json({ success: false, error: 'Vendedor no encontrado' });
      }

      res.json({ success: true, data: vendedor });
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      res.status(500).json({ success: false, error: 'Error al obtener vendedor' });
    }
  }

  // GET /api/vendedores/ranking/general
  static async obtenerRanking(req: Request, res: Response) {
    try {
      const ranking = await VendedorService.obtenerRanking();

      res.json({
        success: true,
        data: ranking,
        count: ranking.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en obtenerRanking:', error);
      res.status(500).json({ success: false, error: 'Error al obtener ranking' });
    }
  }

  // GET /api/vendedores/:id/estadisticas
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const estadisticas = await VendedorService.obtenerEstadisticas(parseInt(id));

      res.json({ success: true, data: estadisticas });
    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
  }
}
