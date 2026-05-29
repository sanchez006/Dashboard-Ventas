import { Request, Response } from 'express';
import comisionService from '../../services/comisionService';
import { db } from '../../db/connection';

export const calcularComisionesVendedor = async (
  req: Request,
  res: Response
) => {
  try {
    const { idAsesor, mes } = req.body;

    if (!idAsesor || !mes) {
      return res.status(400).json({
        error: 'idAsesor y mes son requeridos',
      });
    }

    const mesDate = new Date(mes);
    // Validar que el mes no sea el actual ni futuro
    const ahora = new Date();
    const primerDiaMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    if (mesDate >= primerDiaMesActual) {
      return res.status(400).json({
        error: 'No se puede calcular comisiones del mes actual ni futuro. Solo meses pasados.'
      });
    }
    const comisiones = await comisionService.calcularComisiones(
      idAsesor,
      req.body.nombreAsesor || 'Vendedor',
      mesDate
    );

    res.json({
      success: true,
      data: comisiones,
    });
  } catch (error) {
    console.error('Error en calcularComisionesVendedor:', error);
    res.status(500).json({ error: 'Error calculando comisiones' });
  }
};

export const calcularComisionesMes = async (req: Request, res: Response) => {
  try {
    const { mes } = req.body;

    if (!mes) {
      return res.status(400).json({
        error: 'mes es requerido (formato: YYYY-MM-DD)',
      });
    }

    const mesDate = new Date(mes);
    // Validar que el mes no sea el actual ni futuro
    const ahora = new Date();
    const primerDiaMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    if (mesDate >= primerDiaMesActual) {
      return res.status(400).json({
        error: 'No se puede calcular comisiones del mes actual ni futuro. Solo meses pasados.'
      });
    }
    const comisiones = await comisionService.calcularComisionesMes(mesDate);

    res.json({
      success: true,
      data: comisiones,
      total: comisiones.length,
    });
  } catch (error) {
    console.error('Error en calcularComisionesMes:', error);
    res.status(500).json({ error: 'Error calculando comisiones' });
  }
};

export const obtenerComisiones = async (req: Request, res: Response) => {
  try {
    const { idAsesor, mes } = req.query;

    if (!idAsesor) {
      return res.status(400).json({
        error: 'idAsesor es requerido',
      });
    }

    const comisiones = await comisionService.obtenerComisiones(
      parseInt(idAsesor as string),
      mes ? new Date(mes as string) : undefined
    );

    res.json({
      success: true,
      data: comisiones,
      total: comisiones.length,
    });
  } catch (error) {
    console.error('Error en obtenerComisiones:', error);
    res.status(500).json({ error: 'Error obteniendo comisiones' });
  }
};

export const obtenerComisionesAdmin = async (req: Request, res: Response) => {
  try {
    const { idAsesor, mes } = req.params;

    if (!idAsesor) {
      return res.status(400).json({
        error: 'idAsesor es requerido',
      });
    }

    // Convertir mes de formato YYYY-MM a Date
    let mesDate: Date | undefined;
    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [year, month] = mes.split('-').map(Number);
      mesDate = new Date(year, month - 1, 1);
    }

    const idAsesorNum = parseInt(idAsesor as string);
    
    console.log(`🔍 [ADMIN] Buscando comisiones para vendedor ${idAsesorNum}, mes: ${mes}`);
    
    let comisiones = await comisionService.obtenerComisiones(
      idAsesorNum,
      mesDate
    );

    console.log(`📊 Comisiones encontradas en BD: ${comisiones.length}`);

    // Si no hay datos O si hay datos pero con 0 clientes (datos vacíos), calcular sobre la marcha
    if (!comisiones || comisiones.length === 0 || (comisiones.length > 0 && comisiones[0].cantidad_clientes === 0)) {
      console.log(`⚙️ Recalculando comisiones en tiempo real...`);
      
      // Obtener nombre del vendedor
      const vendedorResult = await db.query(
        `SELECT nombre FROM usuarios WHERE id_asesor = $1`,
        [idAsesorNum]
      );
      const nombreVendedor = vendedorResult[0]?.nombre || `Vendedor ${idAsesorNum}`;

      console.log(`👤 Calculando para: ${nombreVendedor}`);

      // Calcular las comisiones
      const comisionCalculada = await comisionService.calcularComisiones(
        idAsesorNum,
        nombreVendedor,
        mesDate || new Date()
      );

      console.log(`✅ Comisión recalculada:`, comisionCalculada);
      comisiones = [comisionCalculada];
    }

    res.json({
      success: true,
      data: comisiones,
      total: comisiones.length,
    });
  } catch (error) {
    console.error('❌ Error en obtenerComisionesAdmin:', error);
    res.status(500).json({ error: 'Error obteniendo comisiones' });
  }
};

export const obtenerDetallesComision = async (
  req: Request,
  res: Response
) => {
  try {
    const { idComision } = req.params;

    if (!idComision) {
      return res.status(400).json({
        error: 'idComision es requerido',
      });
    }

    const detalles = await comisionService.obtenerDetallesComision(
      parseInt(idComision)
    );

    res.json({
      success: true,
      data: detalles,
      total: detalles.length,
    });
  } catch (error) {
    console.error('Error en obtenerDetallesComision:', error);
    res.status(500).json({ error: 'Error obteniendo detalles' });
  }
};

export const obtenerResumen5Meses = async (
  req: Request,
  res: Response
) => {
  try {
    const { idAsesor } = req.query;

    const resumen = await comisionService.obtenerResumen5Meses(
      idAsesor ? parseInt(idAsesor as string) : undefined
    );

    res.json({
      success: true,
      data: resumen,
      total: resumen.length,
    });
  } catch (error) {
    console.error('Error en obtenerResumen5Meses:', error);
    res.status(500).json({ error: 'Error obteniendo resumen' });
  }
};

export const obtenerTopVendedores = async (req: Request, res: Response) => {
  try {
    const topVendedores = await comisionService.obtenerTopVendedores();

    res.json({
      success: true,
      data: topVendedores,
      total: topVendedores.length,
    });
  } catch (error) {
    console.error('Error en obtenerTopVendedores:', error);
    res.status(500).json({ error: 'Error obteniendo top vendedores' });
  }
};

/**
 * NUEVOS ENDPOINTS PARA EL VENDEDOR LOGUEADO
 */

export const obtenerMisComisiones = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario || !usuario.id_asesor) {
      return res.status(400).json({
        error: 'Usuario o id_asesor no disponible en token',
      });
    }

    // Usar mes del query param si viene, sino el mes actual
    let mesActual: Date;
    const mesQuery = (req.query.mes as string);
    if (mesQuery && /^\d{4}-\d{2}$/.test(mesQuery)) {
      const [y, m] = mesQuery.split('-').map(Number);
      mesActual = new Date(y, m - 1, 1);
    } else {
      const ahora = new Date();
      mesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    console.log(`📊 [COMISIONES] Obteniendo comisiones del mes (${mesActual.getFullYear()}-${String(mesActual.getMonth()+1).padStart(2,'0')}) para vendedor ${usuario.id_asesor}`);

    const comisiones = await comisionService.obtenerComisiones(
      usuario.id_asesor,
      mesActual
    );

    res.json({
      success: true,
      data: comisiones,
      total: comisiones.length,
    });
  } catch (error) {
    console.error('Error en obtenerMisComisiones:', error);
    res.status(500).json({ error: 'Error obteniendo comisiones' });
  }
};

export const obtenerMisClientes = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario || !usuario.id_asesor) {
      return res.status(400).json({
        error: 'Usuario o id_asesor no disponible en token',
      });
    }

    let mesActual: Date;
    const mesQuery = (req.query.mes as string);
    if (mesQuery && /^\d{4}-\d{2}$/.test(mesQuery)) {
      const [y, m] = mesQuery.split('-').map(Number);
      mesActual = new Date(y, m - 1, 1);
    } else {
      mesActual = new Date();
    }

    console.log(`👥 [CLIENTES] Obteniendo clientes del vendedor ${usuario.id_asesor}`);

    const clientes = await comisionService.obtenerClientesDelVendedor(
      usuario.id_asesor,
      mesActual
    );

    res.json({
      success: true,
      data: clientes,
      total: clientes.length,
    });
  } catch (error) {
    console.error('Error en obtenerMisClientes:', error);
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
};

export const obtenerClientesHistorico = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario || !usuario.id_asesor) {
      return res.status(400).json({
        error: 'Usuario o id_asesor no disponible en token',
      });
    }

    console.log(`👥 [CLIENTES HISTÓRICO] Obteniendo clientes de últimos 5 meses del vendedor ${usuario.id_asesor}`);

    const clientes = await comisionService.obtenerClientesUltimos5Meses(usuario.id_asesor);

    res.json({
      success: true,
      data: clientes,
      total: clientes.length,
    });
  } catch (error) {
    console.error('Error en obtenerClientesHistorico:', error);
    res.status(500).json({ error: 'Error obteniendo clientes históricos' });
  }
};

export const obtenerMiResumen5Meses = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    if (!usuario || !usuario.id_asesor) {
      return res.status(400).json({
        error: 'Usuario o id_asesor no disponible en token',
      });
    }

    console.log(`📈 [RESUMEN] Obteniendo resumen de 5 meses del vendedor ${usuario.id_asesor}`);

    const resumen = await comisionService.obtenerResumen5Meses(usuario.id_asesor);

    res.json({
      success: true,
      data: resumen,
      total: resumen.length,
    });
  } catch (error) {
    console.error('Error en obtenerMiResumen5Meses:', error);
    res.status(500).json({ error: 'Error obteniendo resumen' });
  }
};

/**
 * RECALCULAR COMISIONES DE UN MES (Administrador)
 * POST /api/comisiones/admin/recalcular/:mes  (mes en formato YYYY-MM)
 */
export const recalcularMes = async (req: Request, res: Response) => {
  try {
    const mesParam = req.params.mes; // ej: "2026-05"
    const match = mesParam && mesParam.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      return res.status(400).json({ error: 'Formato de mes inválido. Use YYYY-MM' });
    }
    const anio = parseInt(match[1]);
    const mes = parseInt(match[2]) - 1; // 0-based para Date
    const fechaMes = new Date(anio, mes, 1);

    console.log(`🔄 [RECALCULO] Iniciando recalculo de comisiones ${mesParam}...`);

    // Obtener vendedores activos desde la BD
    const vendedoresRows = await db.query(
      `SELECT id_asesor, nombre FROM usuarios WHERE rol = 'vendedor' AND activo = true AND id_asesor IS NOT NULL`
    );
    const vendedores = vendedoresRows.map((r: any) => ({ id_asesor: r.id_asesor, nombre: r.nombre }));

    const resultados: any[] = [];

    for (const v of vendedores) {
      try {
        const comision = await comisionService.calcularComisiones(
          v.id_asesor,
          v.nombre,
          fechaMes
        );
        resultados.push({
          vendedor: v.nombre,
          id_asesor: v.id_asesor,
          clientes: comision.cantidad_clientes,
          facturacion: comision.facturacion_total,
          comision: comision.monto_total_comisiones,
          bono: comision.monto_bono,
          penalizacion: comision.monto_penalizacion,
          total_neto: comision.monto_total_neto,
        });
        console.log(`✅ ${v.nombre}: ${comision.cantidad_clientes} clientes, Q${comision.facturacion_total.toFixed(2)}`);
      } catch (err) {
        console.error(`❌ Error recalculando ${v.nombre}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Comisiones de ${mesParam} recalculadas`,
      data: resultados,
    });
  } catch (error) {
    console.error('Error en recalcularMes:', error);
    res.status(500).json({ error: 'Error recalculando comisiones' });
  }
};

/** @deprecated usar recalcularMes */
export const recalcularAbril2026 = (req: Request, res: Response) => {
  req.params.mes = '2026-04';
  return recalcularMes(req, res);
};

export const obtenerClientesIncumplidos = async (
  req: Request,
  res: Response
) => {
  try {
    const usuario = (req as any).usuario;
    const { idAsesor } = req.query;

    // Usar idAsesor del token (usuario autenticado) o del query param si se proporciona
    const idAsesorFinal = usuario?.id_asesor || (idAsesor ? parseInt(idAsesor as string) : undefined);

    console.log('[obtenerClientesIncumplidos] Debug:', {
      usuario_id: usuario?.id,
      usuario_id_asesor: usuario?.id_asesor,
      query_idAsesor: idAsesor,
      idAsesorFinal: idAsesorFinal
    });

    // Requiere id_asesor
    if (!idAsesorFinal) {
      return res.status(400).json({
        error: 'id_asesor no disponible',
      });
    }

    const incumplimientos = await comisionService.obtenerClientesIncumplidos(
      idAsesorFinal
    );

    console.log('[obtenerClientesIncumplidos] Resultados:', {
      idAsesor: idAsesorFinal,
      total: incumplimientos.length,
    });

    res.json({
      success: true,
      data: incumplimientos,
      total: incumplimientos.length,
    });
  } catch (error) {
    console.error('Error obteniendo incumplimientos:', error);
    res.status(500).json({ error: 'Error obteniendo clientes incumplidos' });
  }
};

export const testCalcularAbril = async (req: Request, res: Response) => {
  try {
    console.log('TEST: Calculando mes anterior...');
    // Siempre calcular mes anterior, NUNCA el mes actual
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    console.log(`Mes a calcular: ${mesAnterior.toLocaleDateString()}`);
    
    const vendedoresResult = await db.query(
      `SELECT id_asesor, nombre FROM usuarios WHERE rol = 'vendedor' AND activo = true AND id_asesor IS NOT NULL`
    );
    let exitosos = 0, fallidos = 0;
    const resultados: any[] = [];
    for (const vendedor of vendedoresResult) {
      try {
        const comision = await comisionService.calcularComisiones(
          vendedor.id_asesor,
          vendedor.nombre,
          mesAnterior
        );
        resultados.push({
          vendedor: vendedor.nombre,
          clientes: comision.cantidad_clientes,
          facturacion: comision.facturacion_total
        });
        exitosos++;
      } catch (err) {
        console.error(`Error ${vendedor.nombre}:`, err);
        fallidos++;
      }
    }
    res.json({
      success: true,
      mensaje: 'Test completado (mes anterior)',
      mesCalculado: mesAnterior.toLocaleDateString(),
      exitosos,
      fallidos,
      vendedores: resultados
    });
  } catch (error) {
    console.error('Error en test:', error);
    res.status(500).json({ error: 'Error en test' });
  }
};
