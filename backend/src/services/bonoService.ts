import { db } from '../db/connection';

export class BonoService {

  // ===============================
  // PROSPECTOS
  // ===============================

  // Normalizar teléfono: remover espacios, +502, mantener solo 8 dígitos
  private static normalizarTelefono(telefonoRaw: string): string {
    if (!telefonoRaw) return '';
    const limpio = telefonoRaw.replace(/\s+/g, '').replace(/^\+502/, '').trim();
    const soloDigitos = limpio.replace(/\D/g, '');
    return soloDigitos.slice(-8);
  }

  // Importar prospectos desde Excel (array de rows ya parseados)
  static async importarProspectos(idAsesor: number, nombreAsesor: string, rows: any[]) {
    const mes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    // Borrar los prospectos del mes actual para ese asesor antes de reimportar
    await db.none('DELETE FROM prospectos WHERE id_asesor = $1 AND mes = $2', [idAsesor, mes]);

    for (const row of rows) {
      const nombreCliente = row['nombre_cliente'] || row['Nombre Cliente'] || row['nombre'] || row['Nombre'] || '';
      const direccion = row['direccion'] || row['Dirección'] || row['direccion'] || row['Direccion'] || '';
      const telefonoRaw = row['telefono'] || row['Telefono'] || row['teléfono'] || row['Teléfono'] || row['numero_telefono'] || row['Numero Telefono'] || '';
      const fechaStr = row['fecha_registro'] || row['Fecha Registro'] || row['fecha'] || row['Fecha'] || new Date().toISOString().slice(0, 10);
      if (!nombreCliente) continue;

      const fecha = fechaStr instanceof Date ? fechaStr.toISOString().slice(0, 10) : fechaStr;
      const telefono = this.normalizarTelefono(telefonoRaw);

      await db.none(
        `INSERT INTO prospectos (id_asesor, nombre_asesor, nombre_cliente, direccion, telefono, fecha_registro, mes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idAsesor, nombreAsesor, nombreCliente, direccion, telefono, fecha, mes]
      );
    }
    return { importados: rows.length };
  }

  // Obtener prospectos del mes para un asesor
  static async obtenerProspectos(idAsesor: number, mes?: string) {
    const mesActual = mes || new Date().toISOString().slice(0, 7);
    return await db.query(
      `SELECT id, nombre_cliente, direccion, telefono, nombre_asesor, fecha_registro, mes
       FROM prospectos
       WHERE id_asesor = $1 AND mes = $2
       ORDER BY fecha_registro DESC`,
      [idAsesor, mesActual]
    );
  }

  // Calcular porcentaje de prospección
  static async getPorcentajeProspeccion(idAsesor: number, mes?: string) {
    const mesActual = mes || new Date().toISOString().slice(0, 7);
    const meta = 100; // 100 prospectos por mes (meta fija)

    const result = await db.one(
      `SELECT COUNT(*) AS total FROM prospectos WHERE id_asesor = $1 AND mes = $2`,
      [idAsesor, mesActual]
    );
    const actual = parseInt(result.total, 10);
    const porcentaje = Math.min(Math.round((actual / meta) * 100), 100);
    return { actual, meta, porcentaje, mes: mesActual };
  }

  // ===============================
  // LLAMADAS DE CALIDAD
  // ===============================

  // Importar llamadas de calidad desde Excel
  static async importarLlamadas(idAsesor: number, nombreAsesor: string, rows: any[]) {
    const mes = new Date().toISOString().slice(0, 7);
    await db.none('DELETE FROM llamadas_calidad WHERE id_asesor = $1 AND mes = $2', [idAsesor, mes]);

    for (const row of rows) {
      const nombreCliente = row['nombre_cliente'] || row['Nombre Cliente'] || row['nombre'] || row['Nombre'] || '';
      const fechaStr = row['fecha_llamada'] || row['Fecha Llamada'] || row['fecha'] || row['Fecha'] || new Date().toISOString().slice(0, 10);
      if (!nombreCliente) continue;

      const fecha = fechaStr instanceof Date ? fechaStr.toISOString().slice(0, 10) : fechaStr;

      await db.none(
        `INSERT INTO llamadas_calidad (id_asesor, nombre_asesor, nombre_cliente, fecha_llamada, mes)
         VALUES ($1, $2, $3, $4, $5)`,
        [idAsesor, nombreAsesor, nombreCliente, fecha, mes]
      );
    }
    return { importados: rows.length };
  }

  // Obtener llamadas del mes para un asesor
  static async obtenerLlamadas(idAsesor: number, mes?: string) {
    const mesActual = mes || new Date().toISOString().slice(0, 7);
    return await db.query(
      `SELECT id, nombre_cliente, fecha_llamada
       FROM llamadas_calidad
       WHERE id_asesor = $1 AND mes = $2
       ORDER BY fecha_llamada DESC`,
      [idAsesor, mesActual]
    );
  }

  // Calcular porcentaje de llamadas de calidad
  // 100% = número de ventas del mes del asesor
  static async getPorcentajeLlamadas(idAsesor: number, mes?: string) {
    const mesActual = mes || new Date().toISOString().slice(0, 7);

    // Total ventas del mes para ese asesor
    const ventasResult = await db.one(
      `SELECT COUNT(*) AS total FROM servicio_wisphub
       WHERE id_asesor = $1 AND TO_CHAR(fecha_instalacion, 'YYYY-MM') = $2`,
      [idAsesor, mesActual]
    );
    const meta = parseInt(ventasResult.total, 10);

    // Total llamadas subidas del mes
    const llamadasResult = await db.one(
      `SELECT COUNT(*) AS total FROM llamadas_calidad WHERE id_asesor = $1 AND mes = $2`,
      [idAsesor, mesActual]
    );
    const actual = parseInt(llamadasResult.total, 10);

    const porcentaje = meta > 0 ? Math.min(Math.round((actual / meta) * 100), 100) : 0;
    return { actual, meta, porcentaje, mes: mesActual };
  }

  // ===============================
  // BONO TOTAL
  // ===============================

  static async getBonoTotal(idAsesor: number, mes?: string) {
    const prospeccion = await this.getPorcentajeProspeccion(idAsesor, mes);
    const llamadas = await this.getPorcentajeLlamadas(idAsesor, mes);

    const BONO_TOTAL = 600;
    const PESO_PROSPECCION = 0.60;  // 60%
    const PESO_LLAMADAS = 0.25;     // 25%
    const PESO_RH = 0.15;           // 15%

    const ganado_prospeccion = Math.round(BONO_TOTAL * PESO_PROSPECCION * (prospeccion.porcentaje / 100));
    const ganado_llamadas = Math.round(BONO_TOTAL * PESO_LLAMADAS * (llamadas.porcentaje / 100));
    const ganado_rh = Math.round(BONO_TOTAL * PESO_RH); // RH no definido, se da completo por ahora

    const total_ganado = ganado_prospeccion + ganado_llamadas + ganado_rh;

    return {
      bono_total: BONO_TOTAL,
      prospeccion: {
        peso: 60,
        monto_maximo: BONO_TOTAL * PESO_PROSPECCION,
        porcentaje: prospeccion.porcentaje,
        ganado: ganado_prospeccion,
        actual: prospeccion.actual,
        meta: prospeccion.meta
      },
      llamadas: {
        peso: 25,
        monto_maximo: BONO_TOTAL * PESO_LLAMADAS,
        porcentaje: llamadas.porcentaje,
        ganado: ganado_llamadas,
        actual: llamadas.actual,
        meta: llamadas.meta
      },
      rh: {
        peso: 15,
        monto_maximo: BONO_TOTAL * PESO_RH,
        porcentaje: 100,
        ganado: ganado_rh
      },
      total_ganado
    };
  }
}
