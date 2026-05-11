import { db } from '../db/connection';
import { DashboardKPIs, KPI } from '../models/kpi.model';

export class KPIService {
  
  // Obtener todos los KPIs del dashboard
  static async obtenerKPIsDashboard(): Promise<DashboardKPIs> {
    try {
      // Total de clientes
      const clientesResult = await db.one('SELECT COUNT(*) as total FROM servicio_wisphub');
      const totalClientes: KPI = {
        id: 'clientes',
        nombre: 'Total Clientes',
        valor: clientesResult.total,
        meta: 16000,
        porcentaje: (clientesResult.total / 16000) * 100,
        tendencia: 'arriba',
        icon: 'people_outline',
        color: 'accent',
        descripcion: 'Clientes registrados en la plataforma'
      };

      // Ventas del mes (ingresos totales)
      const ventasResult = await db.one(
        `SELECT COALESCE(SUM(CAST(precio_plan AS DECIMAL)), 0) as total 
        FROM servicio_wisphub`
      );
      const ventasDelMes: KPI = {
        id: 'ventas',
        nombre: 'Ingresos Totales',
        valor: parseFloat(ventasResult.total),
        meta: 500000,
        porcentaje: (parseFloat(ventasResult.total) / 500000) * 100,
        tendencia: 'arriba',
        icon: 'trending_up',
        color: 'warn',
        descripcion: 'Ingresos generados'
      };

      // Meta cumplida (clientes activos)
      const clientesActivosResult = await db.one(
        `SELECT COUNT(*) as total FROM servicio_wisphub WHERE estado = 'Activo'`
      );
      const metaCumplida: KPI = {
        id: 'meta',
        nombre: 'Meta Cumplida',
        valor: clientesActivosResult.total,
        meta: 12000,
        porcentaje: (clientesActivosResult.total / 12000) * 100,
        tendencia: clientesActivosResult.total > 11500 ? 'arriba' : 'estable',
        icon: 'check_circle',
        color: 'primary',
        descripcion: 'Clientes activos vs meta'
      };

      // Total de vendedores (comentado por ahora - tabla no existe)
      // const vendedoresResult = await db.one('SELECT COUNT(*) as total FROM vendedores');
      const totalVendedores: KPI = {
        id: 'vendedores',
        nombre: 'Total Vendedores',
        valor: 0,
        meta: 50,
        porcentaje: 0,
        tendencia: 'estable',
        icon: 'people',
        color: 'primary',
        descripcion: 'Vendedores activos en el sistema'
      };

      // NPS Score (simulado)
      const npsScore: KPI = {
        id: 'nps',
        nombre: 'NPS Score',
        valor: 72,
        meta: 70,
        porcentaje: 102,
        tendencia: 'arriba',
        icon: 'star',
        color: 'accent',
        descripcion: 'Puntuación de satisfacción'
      };

      // Tasa Churn
      const churnResult = await db.one(
        `SELECT COUNT(*) as total FROM servicio_wisphub WHERE estado = 'Cancelado'`
      );
      const tasaChurn: KPI = {
        id: 'churn',
        nombre: 'Tasa Churn',
        valor: parseFloat(((churnResult.total / clientesResult.total) * 100).toFixed(2)),
        meta: 5,
        porcentaje: ((churnResult.total / clientesResult.total) * 100 / 5) * 100,
        tendencia: 'abajo',
        icon: 'trending_down',
        color: 'warn',
        descripcion: 'Porcentaje de cancelaciones'
      };

      // Ingreso Recurrente Mensual
      const ingresoRecurrente: KPI = {
        id: 'mrr',
        nombre: 'Ingreso Recurrente Mensual',
        valor: parseFloat(ventasResult.total),
        meta: 450000,
        porcentaje: (parseFloat(ventasResult.total) / 450000) * 100,
        tendencia: 'arriba',
        icon: 'attach_money',
        color: 'primary',
        descripcion: 'MRR mensual'
      };

      // Oportunidades (clientes inactivos o por activar)
      const oportunidadesResult = await db.one(
        `SELECT COUNT(*) as total FROM servicio_wisphub WHERE estado != 'Activo'`
      );
      const clientesPorGanar: KPI = {
        id: 'oportunidades',
        nombre: 'Oportunidades',
        valor: oportunidadesResult.total,
        meta: 1000,
        porcentaje: (oportunidadesResult.total / 1000) * 100,
        tendencia: 'estable',
        icon: 'flag',
        color: 'accent',
        descripcion: 'Clientes inactivos o por activar'
      };

      return {
        totalVendedores,
        totalClientes,
        ventasDelMes,
        metaCumplida,
        npsScore,
        tasaChurn,
        ingresoRecurrente,
        clientesPorGanar
      };
    } catch (error) {
      console.error('Error al obtener KPIs:', error);
      throw error;
    }
  }

  // Obtener KPI individual
  static async obtenerKPI(id: string): Promise<KPI | null> {
    const kpis = await this.obtenerKPIsDashboard();
    return kpis[id as keyof DashboardKPIs] || null;
  }
}
