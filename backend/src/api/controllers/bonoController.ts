import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { BonoService } from '../../services/bonoService';
import { sincronizarLlamadas, sincronizarTodo, debugObtenerFilasProspectos } from '../../services/googleSheetsService';

export class BonoController {

  // POST /api/bono/prospectos/importar
  static async importarProspectos(req: Request, res: Response) {
    try {
      const file = (req as any).file;
      if (!file) return res.status(400).json({ success: false, error: 'No se recibió archivo' });

      const idAsesor = parseInt(req.body.id_asesor);
      const nombreAsesor = req.body.nombre_asesor || '';
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });

      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const result = await BonoService.importarProspectos(idAsesor, nombreAsesor, rows);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error importando prospectos:', error);
      res.status(500).json({ success: false, error: 'Error al importar prospectos' });
    }
  }

  // GET /api/bono/prospectos/:id_asesor?mes=YYYY-MM
  static async obtenerProspectos(req: Request, res: Response) {
    try {
      const idAsesor = parseInt(req.params.id_asesor);
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });
      const mes = req.query.mes as string | undefined;
      const data = await BonoService.obtenerProspectos(idAsesor, mes);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error obteniendo prospectos:', error);
      res.status(500).json({ success: false, error: 'Error al obtener prospectos' });
    }
  }

  // GET /api/bono/prospectos/porcentaje/:id_asesor
  static async getPorcentajeProspeccion(req: Request, res: Response) {
    try {
      const idAsesor = parseInt(req.params.id_asesor);
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });

      const data = await BonoService.getPorcentajeProspeccion(idAsesor);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error calculando % prospección:', error);
      res.status(500).json({ success: false, error: 'Error al calcular porcentaje' });
    }
  }

  // POST /api/bono/llamadas/importar
  static async importarLlamadas(req: Request, res: Response) {
    try {
      const file = (req as any).file;
      if (!file) return res.status(400).json({ success: false, error: 'No se recibió archivo' });

      const idAsesor = parseInt(req.body.id_asesor);
      const nombreAsesor = req.body.nombre_asesor || '';
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });

      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const result = await BonoService.importarLlamadas(idAsesor, nombreAsesor, rows);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error importando llamadas:', error);
      res.status(500).json({ success: false, error: 'Error al importar llamadas' });
    }
  }

  // GET /api/bono/llamadas/lista/:id_asesor?mes=YYYY-MM
  static async obtenerLlamadas(req: Request, res: Response) {
    try {
      const idAsesor = parseInt(req.params.id_asesor);
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });
      const mes = req.query.mes as string | undefined;
      const data = await BonoService.obtenerLlamadas(idAsesor, mes);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error obteniendo llamadas:', error);
      res.status(500).json({ success: false, error: 'Error al obtener llamadas' });
    }
  }

  // GET /api/bono/llamadas/porcentaje/:id_asesor?mes=YYYY-MM
  static async getPorcentajeLlamadas(req: Request, res: Response) {
    try {
      const idAsesor = parseInt(req.params.id_asesor);
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });
      const mes = req.query.mes as string | undefined;
      const data = await BonoService.getPorcentajeLlamadas(idAsesor, mes);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error calculando % llamadas:', error);
      res.status(500).json({ success: false, error: 'Error al calcular porcentaje' });
    }
  }

  // GET /api/bono/total/:id_asesor?mes=YYYY-MM
  static async getBonoTotal(req: Request, res: Response) {
    try {
      const idAsesor = parseInt(req.params.id_asesor);
      if (isNaN(idAsesor)) return res.status(400).json({ success: false, error: 'id_asesor inválido' });
      const mes = req.query.mes as string | undefined;
      const data = await BonoService.getBonoTotal(idAsesor, mes);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error calculando bono total:', error);
      res.status(500).json({ success: false, error: 'Error al calcular bono total' });
    }
  }

  // POST /api/bono/sincronizar/llamadas-sheets
  // Sincronizar llamadas de calidad desde Google Sheets
  static async sincronizarLlamadasSheets(req: Request, res: Response) {
    try {
      console.log('🔄 [API] Sincronizando llamadas desde Google Sheets...');
      const result = await sincronizarLlamadas();
      res.json({
        success: true,
        message: `Llamadas sincronizadas desde Google Sheets`,
        llamadas: result.sincronizados,
        rechazados: result.rechazados
      });
    } catch (error) {
      console.error('Error sincronizando llamadas desde Sheets:', error);
      res.status(500).json({ success: false, error: 'Error al sincronizar llamadas desde Sheets' });
    }
  }

  // POST /api/bono/sincronizar/sheets
  // Sincronizar PROSPECTOS + LLAMADAS desde Google Sheets (asincrónico)
  static sincronizarTodoSheets(req: Request, res: Response) {
    console.log('🔄 [API] Sincronización iniciada desde Google Sheets...');
    
    // Devolver inmediatamente sin esperar
    res.json({
      success: true,
      message: 'Sincronización iniciada desde Google Sheets'
    });

    // Ejecutar en background
    setImmediate(async () => {
      try {
        const result = await sincronizarTodo();
        console.log('✅ [API] Sincronización completada:', {
          prospectos: result.prospectos,
          llamadas: result.llamadas
        });
      } catch (error) {
        console.error('❌ [API] Error en sincronización background:', error);
      }
    });
  }

  // GET /api/bono/debug/prospectos-sheets
  // Ver exactamente qué filas está leyendo de Google Sheets (DEBUG)
  static async debugProspectosSheets(req: Request, res: Response) {
    try {
      const filas = await debugObtenerFilasProspectos();
      res.json({
        success: true,
        totalFilas: filas.length,
        filas: filas
      });
    } catch (error) {
      console.error('Error en debug:', error);
      res.status(500).json({ success: false, error: 'Error al obtener filas' });
    }
  }
}
