import { db } from '../db/connection';
import { Cliente, ClienteDetalle } from '../models/cliente.model';

export class ClienteService {
    // Obtener total de clientes por mes desde diciembre 2025 para un asesor
    static async obtenerTotalesPorMesDesdeDiciembre2025(idAsesor: number) {
      try {
        return await db.query(
          `SELECT 
            TO_CHAR(fecha_instalacion, 'YYYY-MM') AS mes,
            COUNT(*) AS total
          FROM servicio_wisphub
          WHERE fecha_instalacion >= '2025-12-01' AND id_asesor = $1
          GROUP BY mes
          ORDER BY mes ASC`,
          [idAsesor]
        );
      } catch (error) {
        console.error('Error al obtener totales de clientes por mes:', error);
        throw error;
      }
    }
  
  // Obtener todos los clientes desde servicio_wisphub
  static async obtenerTodos(limit: number = 100, offset: number = 0): Promise<Cliente[]> {
    try {
      return await db.query(
        `SELECT 
          id_servicio, usuario, nombre_cliente, email, telefono, 
          direccion, municipio, estado, precio_plan, estado_factura,
          fecha_instalacion, fecha_corte, nombre_plan, nombre_zona,
          id_asesor, nombre_asesor, forma_contratacion
        FROM servicio_wisphub 
        ORDER BY id_servicio DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  // Obtener un cliente con detalles completos
  static async obtenerPorId(idServicio: number): Promise<ClienteDetalle | null> {
    try {
      return await db.oneOrNone(
        `SELECT 
          id_servicio, usuario, nombre_cliente, email, telefono,
          direccion, municipio, estado, precio_plan, estado_factura,
          fecha_instalacion, fecha_corte, nombre_plan, nombre_zona,
          id_asesor, nombre_asesor, forma_contratacion,
          coordenada, id_tecnico, nombre_tecnico
        FROM servicio_wisphub
        WHERE id_servicio = $1`,
        [idServicio]
      );
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  }

  // Obtener clientes por estado
  static async obtenerPorEstado(estado: string): Promise<Cliente[]> {
    try {
      return await db.query(
        `SELECT 
          id_servicio, usuario, nombre_cliente, email, telefono, 
          direccion, municipio, estado, precio_plan, estado_factura,
          fecha_instalacion, fecha_corte, nombre_plan, nombre_zona,
          id_asesor, nombre_asesor, forma_contratacion
        FROM servicio_wisphub 
        WHERE estado = $1 
        ORDER BY id_servicio DESC`,
        [estado]
      );
    } catch (error) {
      console.error('Error al obtener clientes por estado:', error);
      throw error;
    }
  }

  // Contar total de clientes
  static async contar(): Promise<number> {
    try {
      const result = await db.one('SELECT COUNT(*) as total FROM servicio_wisphub');
      return result.total;
    } catch (error) {
      console.error('Error al contar clientes:', error);
      throw error;
    }
  }

  // Obtener resumen por estado
  static async obtenerResumenPorEstado() {
    try {
      return await db.query(
        `SELECT 
          estado,
          COUNT(*) as cantidad,
          SUM(CAST(precio_plan AS DECIMAL)) as ingresoTotal
        FROM servicio_wisphub
        GROUP BY estado`
      );
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      throw error;
    }
  }

  // Obtener clientes con próximo vencimiento de convenio
  static async obtenerProximosVencimientos(diasAntelacion: number = 30) {
    try {
      return await db.query(
        `SELECT 
          id_servicio, nombre_cliente, email, telefono,
          fecha_corte, estado, precio_plan, estado_factura
        FROM servicio_wisphub
        WHERE fecha_corte BETWEEN NOW() AND NOW() + INTERVAL '${diasAntelacion} days'
        AND estado = 'Activo'
        ORDER BY fecha_corte ASC`
      );
    } catch (error) {
      console.error('Error al obtener próximos vencimientos:', error);
      throw error;
    }
  }
}
