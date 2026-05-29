import { db } from '../db/connection';

export interface ClienteComision {
  id_servicio: number;
  nombre_cliente: string;
  nombre_plan: string;
  precio_plan: number;
  estado_factura: string; // 'Pagadas', 'Pendiente', 'Vencido', etc
  fecha_instalacion: string;
}

export interface ComisionMes {
  id_asesor: number;
  nombre_asesor: string;
  mes: Date;
  facturacion_total: number;
  cantidad_clientes: number;
  monto_total_comisiones: number;
  aplica_comisiones: boolean;
  monto_bono: number;
  monto_penalizacion: number;
  monto_total_neto: number;
}

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

class ComisionService {
  /**
   * Obtener el nombre del mes en español
   */
  private getNombreMes(fecha: Date): string {
    const mes = MESES_NOMBRES[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${mes} ${año}`;
  }

  /**
   * Obtener todos los clientes de un vendedor en un mes específico (mes actual)
   */
  async obtenerClientesDelVendedor(
    idAsesor: number,
    mes: Date
  ): Promise<ClienteComision[]> {
    console.log(`🔎 Buscando clientes: idAsesor=${idAsesor}, mes=${mes.toISOString()}, year=${mes.getFullYear()}, month=${mes.getMonth()+1}`);
    
    const query = `
      SELECT 
        id_servicio,
        nombre_cliente,
        nombre_plan,
        precio_plan::numeric,
        estado_factura,
        telefono,
        codigo_net,
        TO_CHAR(fecha_instalacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_instalacion,
        estado
      FROM servicio_wisphub
      WHERE id_asesor = $1
      AND EXTRACT(YEAR FROM fecha_instalacion) = EXTRACT(YEAR FROM $2::timestamp)
      AND EXTRACT(MONTH FROM fecha_instalacion) = EXTRACT(MONTH FROM $2::timestamp)
      AND estado != 'Cancelado'
      ORDER BY fecha_instalacion ASC
    `;

    const result = await db.query(query, [idAsesor, mes]);
    console.log(`✅ Clientes encontrados: ${result.length}`);
    return result;
  }

  /**
   * Obtener clientes de los últimos 5 meses (sin incluir mes actual)
   * Ej: Nov 2025 - Mar 2026 (sin Abril 2026)
   */
  async obtenerClientesUltimos5Meses(idAsesor: number): Promise<ClienteComision[]> {
    const query = `
      SELECT 
        id_servicio,
        nombre_cliente,
        nombre_plan,
        precio_plan::numeric,
        estado_factura,
        telefono,
        codigo_net,
        TO_CHAR(fecha_instalacion, 'YYYY-MM-DD HH24:MI:SS') as fecha_instalacion,
        estado
      FROM servicio_wisphub
      WHERE id_asesor = $1
      AND fecha_instalacion >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')::DATE
      AND fecha_instalacion < DATE_TRUNC('month', NOW())::DATE
      ORDER BY fecha_instalacion DESC
    `;

    const result = await db.query(query, [idAsesor]);
    return result;
  }

  /**
   * Obtener info del plan de comisión
   */
  async obtenerPlanComision(nombrePlan: string): Promise<any> {
    const query = `
      SELECT 
        id,
        nombre_plan,
        precio_plan::numeric,
        porcentaje_comision::numeric,
        monto_comision::numeric
      FROM planes_comisiones
      WHERE nombre_plan = $1
    `;

    const result = await db.query(query, [nombrePlan]);
    return result[0] || null;
  }

  /**
   * Obtener comisión según rango de precio del plan
   */
  async obtenerComisionPorPrecio(precioPlan: number): Promise<any> {
    const query = `
      SELECT 
        monto_comision::numeric,
        porcentaje_comision::numeric
      FROM rangos_comisiones
      WHERE $1::numeric >= precio_minimo 
        AND ($1::numeric < precio_maximo OR precio_maximo IS NULL)
      ORDER BY precio_minimo DESC
      LIMIT 1
    `;

    const result = await db.query(query, [precioPlan]);
    return result[0] || { monto_comision: 0, porcentaje_comision: 0 };
  }

  /**
   * Obtener el bono según rango de facturación
   */
  async obtenerBonoSegunRango(
    facturacionTotal: number
  ): Promise<{ monto_bono: number }> {
    const query = `
      SELECT monto_bono::numeric
      FROM bonos_facturacion
      WHERE $1 >= facturacion_minima 
        AND ($1 < facturacion_maxima OR facturacion_maxima IS NULL)
      LIMIT 1
    `;

    const result = await db.query(query, [facturacionTotal]);
    return result[0] || { monto_bono: 0 };
  }

  /**
   * Calcular comisiones para un vendedor en un mes específico
   */
  async calcularComisiones(
    idAsesor: number,
    nombreAsesor: string,
    mes: Date
  ): Promise<ComisionMes> {
    // 1. Obtener todos los clientes del vendedor (ORDENADOS por fecha instalación)
    const clientes = await this.obtenerClientesDelVendedor(idAsesor, mes);
    
    console.log(`📋 Asesor ${idAsesor} (${nombreAsesor}) - Mes ${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}: ${clientes.length} clientes encontrados`);

    // 2. PRIMERO: Calcular facturación total (para verificar umbral)
    let facturacionTotal = 0;
    for (const cliente of clientes) {
      const precioPlan = Number(cliente.precio_plan) || 0;
      facturacionTotal += precioPlan;
    }

    const umbralComision = 4000;
    const aplica_comisiones = facturacionTotal >= umbralComision;

    console.log(`💰 Facturación Total: Q${facturacionTotal} - ¿Aplica comisiones?: ${aplica_comisiones}`);

    // 3. SEGUNDO: Procesar cada cliente (ahora sabemos si aplica comisión)
    let montoComisonesTotal = 0;
    let montoBonoTotal = 0;
    let montoPenalizacionTotal = 0;

    const detallesComisiones: any[] = [];

    for (const cliente of clientes) {
      const pagó = cliente.estado_factura === 'Pagadas';
      const precioPlan = Number(cliente.precio_plan) || 0;

      // Obtener plan de comisión POR PRECIO (rango)
      const plan = await this.obtenerComisionPorPrecio(precioPlan);
      if (!plan || !plan.monto_comision) {
        detallesComisiones.push({
          id_servicio: cliente.id_servicio,
          nombre_cliente: cliente.nombre_cliente,
          nombre_plan: cliente.nombre_plan,
          precio_plan: precioPlan,
          porcentaje_comision: 0,
          monto_comision: 0,
          monto_bono: 0,
          cliente_pago: pagó,
          penalizacion: 0,
        });
        continue;
      }

      const montoComision = Number(plan.monto_comision) || 0;

      // SUMAR COMISIÓN si aplica (i.e., si facturación >= Q 4,000)
      if (aplica_comisiones) {
        montoComisonesTotal += montoComision;
      }

      // PENALIZACIÓN: Si el cliente NO pago, se le retiene su comisión según su plan
      let penalizacion = 0;
      if (!pagó) {
        penalizacion = aplica_comisiones ? montoComision : 0;
        if (penalizacion > 0) {
          montoPenalizacionTotal += penalizacion;
        }

        // Registrar incumplimiento SOLO si el mes es anterior al actual
        const hoy = new Date();
        const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const primerDiaMesCalculo = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const mesActual = new Date(mes).getMonth(); // 0-11, abril = 3
        const yearActual = new Date(mes).getFullYear();
        const esAbrilOPosterior = yearActual > 2026 || (yearActual === 2026 && mesActual >= 3);

        if (
          esAbrilOPosterior &&
          cliente.fecha_instalacion &&
          primerDiaMesCalculo < primerDiaMesActual // Solo meses pasados
        ) {
          await this.registrarIncumplimiento(
            cliente.id_servicio,
            idAsesor,
            cliente.nombre_cliente,
            new Date(cliente.fecha_instalacion),
            precioPlan,
            penalizacion || montoComision, // Usa montoComision aunque no haya penalizacion aplicada aún
            mes
          );
        }
      }

      // Guardar detalle
      detallesComisiones.push({
        id_servicio: cliente.id_servicio,
        nombre_cliente: cliente.nombre_cliente,
        nombre_plan: cliente.nombre_plan,
        precio_plan: precioPlan,
        porcentaje_comision: plan.porcentaje_comision,
        monto_comision: aplica_comisiones ? montoComision : 0,
        monto_bono: 0,  // Bono fijo se asigna al final, no por cliente
        cliente_pago: pagó,
        penalizacion: penalizacion,
      });
    }

    // 4. CALCULAR BONO FIJO según rango de facturación TOTAL del mes
    if (aplica_comisiones) {
      if (facturacionTotal >= 7001) {
        montoBonoTotal = 1000;
      } else if (facturacionTotal >= 5001) {
        montoBonoTotal = 700;
      } else if (facturacionTotal >= 4501) {
        montoBonoTotal = 400;
      }
    }
    const montoTotalNeto = aplica_comisiones ? montoComisonesTotal + montoBonoTotal - montoPenalizacionTotal : 0;

    const comisionMes: ComisionMes = {
      id_asesor: idAsesor,
      nombre_asesor: nombreAsesor,
      mes,
      facturacion_total: facturacionTotal,
      cantidad_clientes: clientes.length,
      monto_total_comisiones: montoComisonesTotal,
      aplica_comisiones: aplica_comisiones,
      monto_bono: montoBonoTotal,
      monto_penalizacion: montoPenalizacionTotal,
      monto_total_neto: montoTotalNeto,
    };

    // 5. Guardar en base de datos
    await this.guardarComisiones(comisionMes, detallesComisiones);

    return comisionMes;
  }

  /**
   * Guardar comisiones en la BD
   */
  private async guardarComisiones(
    comision: ComisionMes,
    detalles: any[]
  ): Promise<void> {
    try {
      // Insertar o actualizar la comisión principal
      const queryComision = `
        INSERT INTO comisiones_vendedor (
          id_asesor, nombre_asesor, mes, 
          facturacion_total, cantidad_clientes,
          monto_total_comisiones, aplica_comisiones,
          monto_bono, monto_penalizacion, monto_total_neto, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        ON CONFLICT (id_asesor, mes) DO UPDATE SET
          facturacion_total = EXCLUDED.facturacion_total,
          cantidad_clientes = EXCLUDED.cantidad_clientes,
          monto_total_comisiones = EXCLUDED.monto_total_comisiones,
          aplica_comisiones = EXCLUDED.aplica_comisiones,
          monto_bono = EXCLUDED.monto_bono,
          monto_penalizacion = EXCLUDED.monto_penalizacion,
          monto_total_neto = EXCLUDED.monto_total_neto,
          updated_at = NOW()
        RETURNING id
      `;

      const resultComision = await db.query(queryComision, [
        comision.id_asesor,
        comision.nombre_asesor,
        comision.mes,
        comision.facturacion_total,
        comision.cantidad_clientes,
        comision.monto_total_comisiones,
        comision.aplica_comisiones,
        comision.monto_bono,
        comision.monto_penalizacion,
        comision.monto_total_neto,
      ]);

      const idComision = resultComision[0].id;

      // Limpiar detalles anteriores
      await db.query(
        'DELETE FROM detalle_comisiones_clientes WHERE id_comision = $1',
        [idComision]
      );

      // Insertar detalles por cliente
      for (const detalle of detalles) {
        const queryDetalle = `
          INSERT INTO detalle_comisiones_clientes (
            id_comision, id_servicio, nombre_cliente,
            nombre_plan, precio_plan, porcentaje_comision,
            monto_comision, cliente_pago, penalizacion
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await db.query(queryDetalle, [
          idComision,
          detalle.id_servicio,
          detalle.nombre_cliente,
          detalle.nombre_plan,
          detalle.precio_plan,
          detalle.porcentaje_comision,
          detalle.monto_comision,
          detalle.cliente_pago,
          detalle.penalizacion,
        ]);
      }
    } catch (error) {
      console.error('Error guardando comisiones:', error);
      throw error;
    }
  }

  /**
   * Obtener comisiones de un vendedor (mes específico o todos)
   */
  async obtenerComisiones(idAsesor: number, mes?: Date): Promise<ComisionMes[]> {
    let query = `
      SELECT 
        id, id_asesor, nombre_asesor, mes,
        facturacion_total, cantidad_clientes,
        monto_total_comisiones, aplica_comisiones,
        monto_bono, monto_penalizacion, monto_total_neto
      FROM comisiones_vendedor
      WHERE id_asesor = $1
    `;

    const params: any[] = [idAsesor];

    if (mes) {
      // Usar DATE_TRUNC para comparar solo la parte DATE, ignorando hora y zona horaria
      query += ` AND DATE_TRUNC('month', mes) = DATE_TRUNC('month', $2::timestamp)`;
      params.push(mes);
    }

    query += ` ORDER BY mes DESC`;

    const result = await db.query(query, params);
    return result;
  }

  /**
   * Obtener detalles de comisión (por cliente)
   */
  async obtenerDetallesComision(idComision: number): Promise<any[]> {
    const query = `
      SELECT 
        id, id_servicio, nombre_cliente, nombre_plan,
        precio_plan, porcentaje_comision, monto_comision,
        cliente_pago, penalizacion
      FROM detalle_comisiones_clientes
      WHERE id_comision = $1
      ORDER BY nombre_cliente
    `;

    const result = await db.query(query, [idComision]);
    return result;
  }

  /**
   * Obtener resumen de comisiones (últimos 5 meses) usando la vista
   */
  async obtenerResumen5Meses(idAsesor?: number): Promise<any[]> {
    // Obtener últimos 5 meses EXCEPTO el mes actual
    // Ej: Si estamos en Abril 2026, traer: Nov2025, Dic2025, Ene2026, Feb2026, Mar2026
    const query = `
      SELECT 
        id_asesor,
        nombre_asesor,
        mes,
        facturacion_total,
        cantidad_clientes,
        monto_total_comisiones,
        monto_bono,
        monto_penalizacion,
        monto_total_neto
      FROM comisiones_vendedor
      WHERE mes >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')::DATE
      AND mes < DATE_TRUNC('month', NOW())::DATE
      ${idAsesor ? 'AND id_asesor = $1' : ''}
      ORDER BY mes DESC
    `;

    const params: any[] = [];
    if (idAsesor) {
      params.push(idAsesor);
    }

    const result = await db.query(query, params);
    return result;
  }

  /**
   * Obtener top vendedores del mes actual
   */
  async obtenerTopVendedores(): Promise<any[]> {
    const query = `SELECT * FROM vista_top_vendedores_mes`;
    const result = await db.query(query);
    return result;
  }

  /**
   * Calcular comisiones para TODOS los vendedores en un mes
   */
  async calcularComisionesMes(mes: Date): Promise<ComisionMes[]> {
    // Obtener todos los vendedores únicos
    const query = `
      SELECT DISTINCT id_asesor, nombre_asesor
      FROM servicio_wisphub
      WHERE id_asesor IS NOT NULL
      ORDER BY nombre_asesor
    `;

    const result = await db.query(query);
    const vendedores = result;

    const comisiones: ComisionMes[] = [];

    for (const vendedor of vendedores) {
      try {
        const comision = await this.calcularComisiones(
          vendedor.id_asesor,
          vendedor.nombre_asesor,
          mes
        );
        comisiones.push(comision);
      } catch (error) {
        console.error(
          `Error calculando comisión para vendedor ${vendedor.id_asesor}:`,
          error
        );
      }
    }

    return comisiones;
  }

  /**
   * Registrar incumplimiento de cliente (no pagó)
   */
  async registrarIncumplimiento(
    idServicio: number,
    idAsesor: number,
    nombreCliente: string,
    fechaInstalacion: Date,
    precioPlan: number,
    comisionRetenida: number,
    mes: Date
  ): Promise<void> {
    try {
      // Calcular fecha de vencimiento: 13 del mes siguiente a las 17:00
      const fechaVencimiento = new Date(
        mes.getFullYear(),
        mes.getMonth() + 1,
        13
      );

      // Formato del mes para el historial: "Abril 2026"
      const mesHistorial = this.getNombreMes(mes);

      // Verificar si ya existe registro para este cliente en este vencimiento
      const checkQuery = `
        SELECT id FROM incumplimientos_clientes
        WHERE id_servicio = $1 AND fecha_vencimiento_pago = $2
      `;
      const existing = await db.query(checkQuery, [idServicio, fechaVencimiento]);

      if (existing.length === 0) {
        // Registrar nuevo incumplimiento
        const insertQuery = `
          INSERT INTO incumplimientos_clientes (
            id_servicio, id_asesor, nombre_cliente,
            fecha_instalacion, fecha_vencimiento_pago,
            precio_plan, comision_retenida, contador_incumplimientos, meses_sin_pagar
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8::jsonb)
        `;
        await db.query(insertQuery, [
          idServicio,
          idAsesor,
          nombreCliente,
          fechaInstalacion,
          fechaVencimiento,
          precioPlan,
          comisionRetenida,
          JSON.stringify([mesHistorial]),
        ]);
      } else {
        // Cliente ya existe - verificar si ESTE MES ya fue registrado
        const checkMesQuery = `
          SELECT meses_sin_pagar FROM incumplimientos_clientes
          WHERE id_servicio = $1 AND fecha_vencimiento_pago = $2
        `;
        const resultMes = await db.query(checkMesQuery, [idServicio, fechaVencimiento]);
        const mesesExistentes = resultMes[0]?.meses_sin_pagar || [];
        
        // Si el mes NO está en el historial, añadirlo e incrementar contador
        if (!mesesExistentes.includes(mesHistorial)) {
          const incrementQuery = `
            UPDATE incumplimientos_clientes
            SET 
              contador_incumplimientos = contador_incumplimientos + 1,
              meses_sin_pagar = meses_sin_pagar || $3::jsonb
            WHERE id_servicio = $1 AND fecha_vencimiento_pago = $2
          `;
          await db.query(incrementQuery, [
            idServicio,
            fechaVencimiento,
            JSON.stringify([mesHistorial]),
          ]);
        }
        // Si el mes YA está en el historial, no hace nada (idempotente)
      }

      // Incrementar contador en servicio_wisphub
      const updateQuery = `
        UPDATE servicio_wisphub
        SET contador_incumplimientos = contador_incumplimientos + 1
        WHERE id_servicio = $1
      `;
      await db.query(updateQuery, [idServicio]);
    } catch (error) {
      console.error('Error registrando incumplimiento:', error);
    }
  }

  /**
   * Obtener clientes con incumplimientos desde Abril 2026 en adelante (ventana de 6 meses)
   */
  async obtenerClientesIncumplidos(idAsesor?: number): Promise<any[]> {
    let query = `
      SELECT 
        id_servicio, id_asesor, nombre_cliente,
        fecha_instalacion, fecha_vencimiento_pago,
        contador_incumplimientos, precio_plan, comision_retenida,
        meses_sin_pagar, created_at
      FROM incumplimientos_clientes
      WHERE contador_incumplimientos > 0
      AND fecha_vencimiento_pago >= '2026-04-13'
    `;

    const params: any[] = [];

    if (idAsesor) {
      query += ` AND id_asesor = $1`;
      params.push(idAsesor);
    }

    query += ` ORDER BY fecha_vencimiento_pago DESC, nombre_cliente`;

    const result = await db.query(query, params);
    return result;
  }
}

export default new ComisionService();
