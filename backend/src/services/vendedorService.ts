import { db } from '../db/connection';
import { Vendedor, VendedorRanking } from '../models/vendedor.model';

export class VendedorService {
  
  // Obtener todos los vendedores
  static async obtenerTodos(): Promise<Vendedor[]> {
    try {
      return await db.query(
        'SELECT * FROM vendedores ORDER BY nombre'
      );
    } catch (error) {
      console.error('Error al obtener vendedores:', error);
      throw error;
    }
  }

  // Obtener un vendedor por ID
  static async obtenerPorId(id: number): Promise<Vendedor | null> {
    try {
      return await db.oneOrNone(
        'SELECT * FROM vendedores WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error al obtener vendedor:', error);
      throw error;
    }
  }

  // Obtener ranking de vendedores
  static async obtenerRanking(): Promise<VendedorRanking[]> {
    try {
      return await db.query(
        `SELECT 
          v.*,
          ROW_NUMBER() OVER (ORDER BY v.total_ventas DESC) as posicion,
          ROUND((v.total_ventas / v.meta_mensual * 100)::numeric, 2) as progreso_meta,
          CASE 
            WHEN (v.total_ventas / v.meta_mensual) >= 1 THEN 'excelente'
            WHEN (v.total_ventas / v.meta_mensual) >= 0.75 THEN 'bueno'
            WHEN (v.total_ventas / v.meta_mensual) >= 0.5 THEN 'regular'
            ELSE 'bajo'
          END as desempeño
        FROM vendedores v
        ORDER BY v.total_ventas DESC`
      );
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      throw error;
    }
  }

  // Obtener estadísticas de un vendedor
  static async obtenerEstadisticas(vendedorId: number) {
    try {
      return await db.one(
        `SELECT 
          id,
          nombre,
          total_clientes,
          total_ventas,
          meta_mensual,
          ROUND((total_ventas / meta_mensual * 100)::numeric, 2) as progreso,
          ROUND(((total_ventas - meta_mensual) / meta_mensual * 100)::numeric, 2) as variacion
        FROM vendedores 
        WHERE id = $1`,
        [vendedorId]
      );
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}
