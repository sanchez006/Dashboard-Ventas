import { db } from '../db/connection';

/**
 * AdminDashboardService - SOLO para el admin dashboard
 * Muestra datos del MES ACTUAL con % de progreso hacia meta mensual
 * NO afecta a los vendedores ni a sus vistas
 */
export class AdminDashboardService {
  
  /**
   * Obtener resumen global SOLO de los 6 vendedores activos (MES ACTUAL con % meta)
   */
  static async obtenerResumenGlobal() {
    try {
      const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
      const query = `
        SELECT 
          COUNT(DISTINCT u.id)::int as total_vendedores,
          COUNT(DISTINCT s.id_servicio)::int as total_clientes_mes,
          COALESCE(SUM(s.precio_plan::numeric), 0)::float as total_ventas_mes,
          COALESCE(SUM(v.meta_mensual), 0)::float as total_meta_mes,
          ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(SUM(v.meta_mensual), 1)::float) * 100, 2)::float as porcentaje_meta,
          COALESCE(COUNT(DISTINCT CASE WHEN s.estado_factura = 'Pagadas' THEN s.id_servicio END), 0)::int as clientes_pagos,
          COALESCE(COUNT(DISTINCT CASE WHEN s.estado_factura IN ('Pendiente de Pago', 'Vencido') THEN s.id_servicio END), 0)::int as clientes_pendientes
        FROM usuarios u
        LEFT JOIN vendedores v ON u.nombre = v.nombre OR LOWER(u.nombre) = LOWER(v.nombre)
        LEFT JOIN servicio_wisphub s ON (
          (s.nombre_asesor ILIKE u.nombre || '%') OR
          (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        ) AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        WHERE u.rol = 'vendedor'
      `;

      return await db.one(query, [mesActual]);
    } catch (error) {
      console.error('Error en obtenerResumenGlobal:', error);
      throw error;
    }
  }

  /**
   * Obtener TODOS los vendedores (6 principales) con sus datos detallados (MES ACTUAL + % meta)
   */
  static async obtenerVendedoresDetalle() {
    try {
      const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
      const query = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          u.activo as estado,
          COUNT(DISTINCT s.id_servicio)::int as total_clientes_mes,
          COALESCE(SUM(s.precio_plan::numeric), 0)::float as total_ventas_mes,
          COALESCE(v.meta_mensual, 0)::float as meta_mensual,
          ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(v.meta_mensual, 1)::float) * 100, 2)::float as porcentaje_progreso,
          COALESCE(COUNT(DISTINCT CASE WHEN s.estado_factura = 'Pagadas' THEN s.id_servicio END), 0)::int as clientes_pagos,
          COALESCE(COUNT(DISTINCT CASE WHEN s.estado_factura IN ('Pendiente de Pago', 'Vencido') THEN s.id_servicio END), 0)::int as clientes_pendientes
        FROM usuarios u
        LEFT JOIN vendedores v ON u.nombre = v.nombre OR LOWER(u.nombre) = LOWER(v.nombre)
        LEFT JOIN servicio_wisphub s ON (
          (s.nombre_asesor ILIKE u.nombre || '%') OR
          (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        ) AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        WHERE u.rol = 'vendedor'
        GROUP BY u.id, u.nombre, u.email, u.activo, v.meta_mensual
        ORDER BY total_ventas_mes DESC
      `;

      return await db.query(query, [mesActual]);
    } catch (error) {
      console.error('Error en obtenerVendedoresDetalle:', error);
      throw error;
    }
  }

  /**
   * Obtener ranking de vendedores (mes actual, por % hacia meta)
   */
  static async obtenerRankingVendedores() {
    try {
      const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
      const query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(v.meta_mensual, 1)::float) * 100, 2) DESC)::int as posicion,
          u.id,
          u.nombre,
          COUNT(DISTINCT s.id_servicio)::int as total_clientes_mes,
          COALESCE(SUM(s.precio_plan::numeric), 0)::float as total_ventas_mes,
          COALESCE(v.meta_mensual, 0)::float as meta_mensual,
          ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(v.meta_mensual, 1)::float) * 100, 2)::float as porcentaje_progreso,
          COALESCE(SUM(CASE WHEN s.estado_factura = 'Pagadas' THEN s.precio_plan::numeric ELSE 0 END), 0)::float as ventas_pagadas,
          COALESCE(SUM(CASE WHEN s.estado_factura IN ('Pendiente de Pago', 'Vencido') THEN s.precio_plan::numeric ELSE 0 END), 0)::float as ventas_pendientes
        FROM usuarios u
        LEFT JOIN vendedores v ON u.nombre = v.nombre OR LOWER(u.nombre) = LOWER(v.nombre)
        LEFT JOIN servicio_wisphub s ON (
          (s.nombre_asesor ILIKE u.nombre || '%') OR
          (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        ) AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        WHERE u.rol = 'vendedor'
        GROUP BY u.id, u.nombre, u.email, v.meta_mensual
        ORDER BY porcentaje_progreso DESC
      `;

      return await db.query(query, [mesActual]);
    } catch (error) {
      console.error('Error en obtenerRankingVendedores:', error);
      throw error;
    }
  }

  /**
   * Obtener comisiones de un mes específico con % de progreso hacia meta
   */
  static async obtenerComisionesMes(mes: string) {
    try {
      const query = `
        SELECT 
          u.id,
          u.nombre as nombre_vendedor,
          u.email,
          COUNT(DISTINCT s.id_servicio)::int as cantidad_clientes,
          COALESCE(SUM(s.precio_plan::numeric), 0)::float as facturacion_total,
          COALESCE(v.meta_mensual, 0)::float as meta_mensual,
          ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(v.meta_mensual, 1)::float) * 100, 2)::float as porcentaje_progreso,
          COALESCE(SUM(CASE WHEN s.estado_factura = 'Pagadas' THEN s.precio_plan::numeric ELSE 0 END), 0)::float as facturacion_pagada
        FROM usuarios u
        LEFT JOIN vendedores v ON u.nombre = v.nombre OR LOWER(u.nombre) = LOWER(v.nombre)
        LEFT JOIN servicio_wisphub s ON (
          (s.nombre_asesor ILIKE u.nombre || '%') OR
          (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        )
          AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        WHERE u.rol = 'vendedor'
        GROUP BY u.id, u.nombre, u.email, v.meta_mensual
        ORDER BY porcentaje_progreso DESC
      `;

      return await db.query(query, [mes]);
    } catch (error) {
      console.error('Error en obtenerComisionesMes:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de un mes específico (solo 6 vendedores) con % de progreso
   */
  static async obtenerResumenMes(mes: string) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT u.id)::int as total_vendedores,
          COUNT(DISTINCT s.id_servicio)::int as total_clientes,
          COALESCE(SUM(s.precio_plan::numeric), 0)::float as facturacion_total,
          COALESCE(SUM(v.meta_mensual), 0)::float as total_meta,
          ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(SUM(v.meta_mensual), 1)::float) * 100, 2)::float as porcentaje_progreso,
          COALESCE(COUNT(DISTINCT CASE WHEN s.estado_factura = 'Pagadas' THEN s.id_servicio END), 0)::int as clientes_pagados,
          COALESCE(COUNT(DISTINCT CASE WHEN s.estado_factura IN ('Pendiente de Pago', 'Vencido') THEN s.id_servicio END), 0)::int as clientes_pendientes
        FROM usuarios u
        LEFT JOIN vendedores v ON u.nombre = v.nombre OR LOWER(u.nombre) = LOWER(v.nombre)
        LEFT JOIN servicio_wisphub s ON (
          (s.nombre_asesor ILIKE u.nombre || '%') OR
          (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        ) AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        WHERE u.rol = 'vendedor'
      `;

      return await db.oneOrNone(query, [mes]);
    } catch (error) {
      console.error('Error en obtenerResumenMes:', error);
      throw error;
    }
  }

  /**
   * Obtener TODOS los clientes (solo de los 6 vendedores activos, con paginación) del mes actual
   */
  static async obtenerTodosClientes(limit: number, offset: number, mes?: string) {
    try {
      const mesActual = mes || new Date().toISOString().slice(0, 7);
      let queryCount: string;
      let query: string;
      let params: any[];

      queryCount = `
        SELECT COUNT(*) as total FROM servicio_wisphub s
        WHERE TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        AND EXISTS (SELECT 1 FROM usuarios u WHERE u.rol = 'vendedor' AND (
          (s.nombre_asesor ILIKE u.nombre || '%') OR (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        ))
      `;
      
      query = `
        SELECT 
          s.id_servicio,
          s.nombre_cliente,
          s.nombre_plan,
          s.precio_plan::numeric as precio_plan,
          s.estado_factura as estado,
          TO_CHAR(s.fecha_instalacion, 'YYYY-MM-DD') as fecha_instalacion,
          s.nombre_asesor as nombre_vendedor
        FROM servicio_wisphub s
        WHERE TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $1
        AND EXISTS (SELECT 1 FROM usuarios u WHERE u.rol = 'vendedor' AND (
          (s.nombre_asesor ILIKE u.nombre || '%') OR (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        ))
        ORDER BY s.fecha_instalacion DESC
        LIMIT $2 OFFSET $3
      `;

      params = [mesActual, limit, offset];

      const countResult = await db.oneOrNone(queryCount, [mesActual]);
      const clientes = await db.query(query, params);

      return {
        data: clientes,
        pagination: {
          limit,
          offset,
          total: parseInt(countResult?.total || 0),
          pages: Math.ceil(parseInt(countResult?.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error en obtenerTodosClientes:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes de un vendedor específico en un mes
   */
  static async obtenerClientesVendedor(vendedorId: number, mes: string) {
    try {
      // Primero obtener el nombre del vendedor y su meta
      const vendedor = await db.oneOrNone('SELECT nombre, id FROM usuarios WHERE id = $1', [vendedorId]);
      if (!vendedor) return { clientes: [], meta_mensual: 0 };
      
      // Obtener meta_mensual del vendedor
      const metaVendedor = await db.oneOrNone(
        'SELECT meta_mensual FROM vendedores WHERE nombre = $1 OR LOWER(nombre) = LOWER($1) LIMIT 1',
        [vendedor.nombre]
      );
      
      const query = `
        SELECT 
          s.id_servicio,
          s.nombre_cliente,
          s.nombre_plan,
          s.precio_plan::numeric as precio_plan,
          s.estado_factura as estado,
          TO_CHAR(s.fecha_instalacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_instalacion
        FROM servicio_wisphub s
        WHERE (
          (s.nombre_asesor ILIKE $1 || '%') OR
          (s.nombre_asesor ILIKE '%' || $1 || '%')
        )
        AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $2
        ORDER BY s.fecha_instalacion DESC
      `;

      const clientes = await db.query(query, [vendedor.nombre, mes]);
      return {
        clientes,
        meta_mensual: metaVendedor?.meta_mensual || 0
      };
    } catch (error) {
      console.error('Error en obtenerClientesVendedor:', error);
      throw error;
    }
  }

  /**
   * Obtener comisiones de un vendedor específico en un mes con % de progreso
   */
  static async obtenerComisionesVendedor(vendedorId: number, mes: string) {
    try {
      // Primero obtener el nombre del vendedor
      const vendedor = await db.oneOrNone('SELECT nombre FROM usuarios WHERE id = $1', [vendedorId]);
      if (!vendedor) return null;
      
      const query = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          COUNT(DISTINCT s.id_servicio)::int as cantidad_clientes,
          COALESCE(SUM(s.precio_plan::numeric), 0)::float as facturacion_total,
          COALESCE(v.meta_mensual, 0)::float as meta_mensual,
          ROUND((COALESCE(SUM(s.precio_plan::numeric), 0)::float / COALESCE(v.meta_mensual, 1)::float) * 100, 2)::float as porcentaje_progreso,
          COALESCE(SUM(CASE WHEN s.estado_factura = 'Pagadas' THEN s.precio_plan::numeric ELSE 0 END), 0)::float as facturacion_pagada
        FROM usuarios u
        LEFT JOIN vendedores v ON u.nombre = v.nombre OR LOWER(u.nombre) = LOWER(v.nombre)
        LEFT JOIN servicio_wisphub s ON (
          (s.nombre_asesor ILIKE u.nombre || '%') OR
          (s.nombre_asesor ILIKE '%' || u.nombre || '%')
        )
          AND TO_CHAR(s.fecha_instalacion, 'YYYY-MM') = $2
        WHERE u.id = $1
        GROUP BY u.id, u.nombre, u.email, v.meta_mensual
      `;

      return await db.oneOrNone(query, [vendedorId, mes]);
    } catch (error) {
      console.error('Error en obtenerComisionesVendedor:', error);
      throw error;
    }
  }
}
