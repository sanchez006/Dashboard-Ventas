import { Request, Response } from 'express';
import { AdminService } from '../../services/adminService';

export class AdminController {
  /**
   * GET /api/admin/dashboard-resumen
   * Obtener resumen general de todos los vendedores (MES ACTUAL con % meta)
   */
  static async obtenerResumenGlobal(req: Request, res: Response) {
    try {
      const resumen = await AdminService.obtenerResumenGlobal();
      res.json({ success: true, data: resumen });
    } catch (error) {
      console.error('Error en obtenerResumenGlobal:', error);
      res.status(500).json({ success: false, error: 'Error al obtener resumen' });
    }
  }

  /**
   * GET /api/admin/vendedores-detalle
   * Obtener todos los vendedores con sus datos detallados (MES ACTUAL con % meta)
   */
  static async obtenerVendedoresDetalle(req: Request, res: Response) {
    try {
      const vendedores = await AdminService.obtenerVendedoresDetalle();
      res.json({ success: true, data: vendedores, count: vendedores.length });
    } catch (error) {
      console.error('Error en obtenerVendedoresDetalle:', error);
      res.status(500).json({ success: false, error: 'Error al obtener vendedores' });
    }
  }

  /**
   * GET /api/admin/comisiones-mes/:mes
   * Obtener comisiones de TODOS los vendedores en un mes específico con % meta
   * Parámetro: mes = YYYY-MM
   */
  static async obtenerComisionesMes(req: Request, res: Response) {
    try {
      const { mes } = req.params;
      if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        return res.status(400).json({ error: 'Formato de mes inválido (usar YYYY-MM)' });
      }

      const comisiones = await AdminService.obtenerComisionesMes(mes);
      res.json({ success: true, data: comisiones, count: comisiones.length });
    } catch (error) {
      console.error('Error en obtenerComisionesMes:', error);
      res.status(500).json({ success: false, error: 'Error al obtener comisiones' });
    }
  }

  /**
   * GET /api/admin/vendedor/:id/comisiones-mes/:mes
   * Obtener comisiones de un vendedor específico en un mes con % meta
   */
  static async obtenerComisionesVendedor(req: Request, res: Response) {
    try {
      const { id, mes } = req.params;
      if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        return res.status(400).json({ error: 'Formato de mes inválido' });
      }

      const comisiones = await AdminService.obtenerComisionesVendedor(parseInt(id), mes);
      res.json({ success: true, data: comisiones });
    } catch (error) {
      console.error('Error en obtenerComisionesVendedor:', error);
      res.status(500).json({ success: false, error: 'Error al obtener comisiones' });
    }
  }

  /**
   * GET /api/admin/todos-clientes
   * Obtener TODOS los clientes de todos los vendedores (MES ACTUAL)
   */
  static async obtenerTodosClientes(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const mes = req.query.mes as string;

      const resultado = await AdminService.obtenerTodosClientes(limit, offset, mes);
      res.json({ success: true, ...resultado });
    } catch (error) {
      console.error('Error en obtenerTodosClientes:', error);
      res.status(500).json({ success: false, error: 'Error al obtener clientes' });
    }
  }

  /**
   * GET /api/admin/vendedor/:id/clientes/:mes
   * Obtener clientes de un vendedor específico en un mes
   */
  static async obtenerClientesVendedor(req: Request, res: Response) {
    try {
      const { id, mes } = req.params;
      const resultado = await AdminService.obtenerClientesVendedor(parseInt(id), mes);
      res.json({ success: true, data: resultado.clientes, count: resultado.clientes.length, meta_mensual: resultado.meta_mensual });
    } catch (error) {
      console.error('Error en obtenerClientesVendedor:', error);
      res.status(500).json({ success: false, error: 'Error al obtener clientes' });
    }
  }

  /**
   * GET /api/admin/ranking-vendedores
   * Obtener ranking de vendedores (por % hacia meta del mes actual)
   */
  static async obtenerRankingVendedores(req: Request, res: Response) {
    try {
      const ranking = await AdminService.obtenerRankingVendedores();
      res.json({ success: true, data: ranking });
    } catch (error) {
      console.error('Error en obtenerRankingVendedores:', error);
      res.status(500).json({ success: false, error: 'Error al obtener ranking' });
    }
  }

  /**
   * GET /api/admin/resumen-mes/:mes
   * Obtener resumen agregado de comisiones para un mes específico con % meta
   */
  static async obtenerResumenMes(req: Request, res: Response) {
    try {
      const { mes } = req.params;
      if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        return res.status(400).json({ error: 'Formato de mes inválido' });
      }

      const resumen = await AdminService.obtenerResumenMes(mes);
      res.json({ success: true, data: resumen });
    } catch (error) {
      console.error('Error en obtenerResumenMes:', error);
      res.status(500).json({ success: false, error: 'Error al obtener resumen' });
    }
  }
}
