import { Request, Response } from 'express';
import { KPIService } from '../../services/kpiService';

export class KPIController {
  
  // GET /api/kpis
  static async obtenerTodos(req: Request, res: Response) {
    try {
      const kpis = await KPIService.obtenerKPIsDashboard();

      res.json({
        success: true,
        data: kpis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en obtenerTodos:', error);
      res.status(500).json({ success: false, error: 'Error al obtener KPIs' });
    }
  }

  // GET /api/kpis/:id
  static async obtenerPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const kpi = await KPIService.obtenerKPI(id);

      if (!kpi) {
        return res.status(404).json({ success: false, error: 'KPI no encontrado' });
      }

      res.json({ success: true, data: kpi });
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      res.status(500).json({ success: false, error: 'Error al obtener KPI' });
    }
  }
}
