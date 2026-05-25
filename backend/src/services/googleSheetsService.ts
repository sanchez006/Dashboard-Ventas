import { google } from 'googleapis';
import path from 'path';
import { db } from '../db/connection';

const SHEET_ID = '1mK8tDHn8XHw-0M2cM_DCs9CPFuvVMeA-14Bbu5tpHX8';
const TAB_PROSPECCION = 'PROSPECCION';
const TAB_LLAMADAS = 'llamadas de calidad';
const CREDENTIALS_PATH = path.join(__dirname, '../pagina-ventas-495219-c355e547bef5.json');

// Normalizar teléfono: remover espacios, +502, mantener solo 8 dígitos
function normalizarTelefono(telefonoRaw: string): string {
  if (!telefonoRaw) return '';
  const limpio = telefonoRaw.replace(/\s+/g, '').replace(/^\+502/, '').trim();
  const soloDigitos = limpio.replace(/\D/g, '');
  return soloDigitos.slice(-8);
}

function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

// Obtener todas las filas de una pestaña del Sheet
async function obtenerFilas(tab: string): Promise<any[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A2:G`,  // Desde fila 2 (saltar encabezados)
  });
  return response.data.values || [];
}

// Sincronizar prospectos desde Google Sheets a la BD
export async function sincronizarProspectos(): Promise<{ sincronizados: number; rechazados: number }> {
  console.log('[SHEETS] Iniciando sincronización de prospectos...');
  
  let filas = await obtenerFilas(TAB_PROSPECCION);
  console.log(`[SHEETS] Filas obtenidas de Google Sheets: ${filas.length}`);
  
  // ✅ ORDENAR por fecha (columna A) - procesar primero las más antiguas
  // Parsear fechas correctamente (DD/M/YYYY HH:MM:SS)
  filas = filas.sort((a, b) => {
    const parseDate = (dateStr: string) => {
      try {
        const partes = dateStr.split(' ');
        const fechaParte = partes[0] || '';
        const [dia, mes, anio] = fechaParte.split('/');
        return Date.UTC(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      } catch {
        return 0;
      }
    };
    return parseDate(a[0] || '') - parseDate(b[0] || '');
  });
  
  let count = 0;
  let rechazados = 0;

  // ✅ OPTIMIZACIÓN: Cargar todos los usuarios UNA SOLA VEZ
  const usuariosRows = await db.manyOrNone(
    `SELECT id_asesor, nombre FROM usuarios WHERE id_asesor IS NOT NULL`
  );
  console.log(`[SHEETS] Usuarios cargados: ${usuariosRows.length}`);
  
  // Crear mapa para búsqueda rápida O(1)
  const usuariosMap = new Map<string, number>();
  for (const u of usuariosRows) {
    usuariosMap.set(u.nombre.toLowerCase(), u.id_asesor);
  }

  // ✅ RASTREAR duplicados DENTRO del batch actual
  const procesadosEnBatch = new Set<string>();

  for (const fila of filas) {
    const marcaTemporal = fila[0] || '';  // A: Fecha/hora registro
    const nombreCliente  = fila[1] || '';  // B: NOMBRE CLIENTE
    const mesTexto       = fila[2] || '';  // C: MES (ej: "FEBRERO 2026")
    const asesor         = fila[3] || '';  // D: ASESOR
    const telefonoRaw    = fila[4] || '';  // E: TELÉFONO
    const direccion      = fila[5] || '';  // F: DIRECCIÓN

    if (!nombreCliente || !asesor || !marcaTemporal) continue;

    // Convertir mes texto a YYYY-MM
    const mes = convertirMesTextoAYYYYMM(mesTexto);
    if (!mes) continue;

    // Normalizar teléfono
    const telefono = normalizarTelefono(telefonoRaw);

    // 🚀 Buscar asesor en mapa
    let idAsesor = usuariosMap.get(asesor.toLowerCase());
    
    // Si no encuentra exactamente, buscar por similitud
    if (!idAsesor) {
      const palabras = asesor.split(/\s+/).filter((p: string) => p.length > 2);
      let mejorMatch: {id: number; score: number} | null = null;
      
      for (const [nombre, id] of usuariosMap) {
        let score = 0;
        for (const palabra of palabras) {
          if (nombre.includes(palabra.toLowerCase())) {
            score++;
          }
        }
        
        if (score > 0 && (!mejorMatch || score > mejorMatch.score)) {
          mejorMatch = {id, score};
        }
      }
      
      const minPalabrasRequeridas = Math.max(2, Math.ceil(palabras.length * 0.6));
      if (mejorMatch && mejorMatch.score >= minPalabrasRequeridas) {
        idAsesor = mejorMatch.id;
      }
    }
    
    if (!idAsesor) continue;

    const nombreAsesor = usuariosRows.find(u => u.id_asesor === idAsesor)?.nombre || asesor;

    // Parsear fecha desde marca temporal en UTC
    let fecha = new Date().toISOString();
    try {
      // Parsear formato de Google Sheets: "30/4/2026 10:36:50"
      const partes = marcaTemporal.split(' ');
      const fechaParte = partes[0]; // "30/4/2026"
      const horaParte = partes[1] || "00:00:00"; // "10:36:50"
      
      const [dia, mesNum, anio] = fechaParte.split('/');
      const [horas, minutos, segundos] = horaParte.split(':').map((x: string) => parseInt(x, 10));
      const timestamp = Date.UTC(
        parseInt(anio, 10),
        parseInt(mesNum, 10) - 1,
        parseInt(dia, 10),
        horas,
        minutos,
        segundos
      );
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) fecha = d.toISOString();
    } catch {}

    // ✅ CLAVE única para rastrear duplicados
    const claveDuplicado = `${idAsesor}|${nombreCliente}|${mes}`;

    // ✅ VALIDACIÓN 1: Duplicado DENTRO del batch actual
    if (procesadosEnBatch.has(claveDuplicado)) {
      console.log(`[SHEETS] Duplicado en batch: ${nombreCliente} (${asesor})`);
      await db.none(
        `INSERT INTO prospectos_rechazados (id_asesor, nombre_asesor, nombre_cliente, direccion, telefono, mes_referencia, motivo_rechazo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id_asesor, nombre_cliente, mes_referencia) DO NOTHING`,
        [idAsesor, nombreAsesor, nombreCliente, direccion, telefono, mes, 'Duplicado - Múltiples registros en mismo batch']
      );
      rechazados++;
      continue;
    }

    // ✅ VALIDACIÓN 2: Duplicado en la BD
    const duplicado = await db.oneOrNone(
      `SELECT id FROM prospectos 
       WHERE id_asesor = $1 AND nombre_cliente = $2 AND (mes = $3 OR (mes IS NULL AND $3 IS NULL))`,
      [idAsesor, nombreCliente, mes]
    );

    if (duplicado) {
      console.log(`[SHEETS] Duplicado en BD: ${nombreCliente} (${asesor})`);
      await db.none(
        `INSERT INTO prospectos_rechazados (id_asesor, nombre_asesor, nombre_cliente, direccion, telefono, mes_referencia, motivo_rechazo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id_asesor, nombre_cliente, mes_referencia) DO NOTHING`,
        [idAsesor, nombreAsesor, nombreCliente, direccion, telefono, mes, 'Duplicado - Cliente ya registrado']
      );
      rechazados++;
      continue;
    }

    // ✅ MARCAR como procesado en este batch
    procesadosEnBatch.add(claveDuplicado);

    // ✅ INSERTAR en prospectos
    await db.none(
      `INSERT INTO prospectos (id_asesor, nombre_asesor, nombre_cliente, direccion, telefono, fecha_registro, mes, fuente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sheets')
       ON CONFLICT (id_asesor, nombre_cliente, mes) DO NOTHING`,
      [idAsesor, nombreAsesor, nombreCliente, direccion, telefono, fecha, mes]
    );
    count++;
  }

  console.log(`[SHEETS] Prospectos: ${count} sincronizados, ${rechazados} rechazados (duplicados)`);
  const resultado = { sincronizados: count, rechazados };
  console.log(`[SHEETS] Retornando:`, resultado);
  return resultado;
}

// Sincronizar llamadas de calidad desde Google Sheets a la BD
// Estructura llamadas: A=Marca temporal, B=ASESOR (ej: "ERWIN ALONZO FV"), C=MES, D=codigo_net, E=NOMBRE DEL USUARIO
export async function sincronizarLlamadas(): Promise<{ sincronizados: number; rechazados: number }> {
  let filas = await obtenerFilas(TAB_LLAMADAS);
  
  // ✅ ORDENAR por fecha (columna A) - procesar primero las más antiguas
  // Parsear fechas correctamente (DD/M/YYYY HH:MM:SS)
  filas = filas.sort((a, b) => {
    const parseDate = (dateStr: string) => {
      try {
        const partes = dateStr.split(' ');
        const fechaParte = partes[0] || '';
        const [dia, mes, anio] = fechaParte.split('/');
        return Date.UTC(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      } catch {
        return 0;
      }
    };
    return parseDate(a[0] || '') - parseDate(b[0] || '');
  });
  
  let sincronizados = 0;
  let rechazados = 0;

  // ✅ OPTIMIZACIÓN: Cargar todos los usuarios UNA SOLA VEZ en lugar de N queries
  const usuariosRows = await db.manyOrNone(
    `SELECT id_asesor, nombre FROM usuarios WHERE id_asesor IS NOT NULL`
  );
  
  // Crear mapa para búsqueda rápida O(1)
  const usuariosMap = new Map<string, number>();
  for (const u of usuariosRows) {
    usuariosMap.set(u.nombre.toLowerCase(), u.id_asesor);
  }

  // ✅ RASTREAR duplicados DENTRO del batch actual
  const procesadosEnBatch = new Set<string>();

  for (const fila of filas) {
    const marcaTemporal  = fila[0] || '';
    const asesorRaw      = fila[1] || '';  // B: ASESOR (puede tener sufijo FV, etc.)
    const mesTexto       = fila[2] || '';  // C: MES (ej: "3. MARZO_26")
    const codigoNetRaw   = fila[3] || '';  // D: código NET (ej: "NET15645" o "15645")
    const nombreCliente  = fila[4] || '';  // E: NOMBRE DEL USUARIO

    if (!asesorRaw || !marcaTemporal || !nombreCliente) continue;

    // Saltar duplicados marcados en el sheet
    if (mesTexto.toUpperCase().includes('DUPLICADO')) continue;

    const mes = convertirMesTextoAYYYYMM(mesTexto);
    if (!mes) continue;

    // Limpiar sufijos del nombre del asesor (FV, etc.)
    const asesor = asesorRaw.replace(/\s+(FV|SV|RV|SB)\s*$/i, '').trim();

    // 🚀 Buscar asesor en mapa (O(1) en lugar de query)
    let idAsesor = usuariosMap.get(asesor.toLowerCase());
    
    // Si no encuentra exactamente, buscar por similitud (requiere múltiples palabras coincidentes)
    if (!idAsesor) {
      const palabras = asesor.split(/\s+/).filter((p: string) => p.length > 2);
      let mejorMatch: {id: number; score: number} | null = null;
      
      // Buscar usuario que contenga el máximo de palabras del nombre del asesor
      for (const [nombre, id] of usuariosMap) {
        let score = 0;
        for (const palabra of palabras) {
          if (nombre.includes(palabra.toLowerCase())) {
            score++;
          }
        }
        
        // Dar prioridad a matches con más palabras coincidentes
        if (score > 0 && (!mejorMatch || score > mejorMatch.score)) {
          mejorMatch = {id, score};
        }
      }
      
      // ✅ Solo aceptar si al menos 2 palabras coinciden O todas las palabras coinciden
      const minPalabrasRequeridas = Math.max(2, Math.ceil(palabras.length * 0.6));
      if (mejorMatch && mejorMatch.score >= minPalabrasRequeridas) {
        idAsesor = mejorMatch.id;
      }
    }
    
    if (!idAsesor) continue;

    // Obtener nombre del asesor del mapa
    const nombreAsesor = usuariosRows.find(u => u.id_asesor === idAsesor)?.nombre || asesor;

    // Parsear fecha en UTC
    let fechaLlamada = new Date().toISOString();
    let fechaDate = new Date();
    try {
      const partes = marcaTemporal.split(' ');
      const fechaParte = partes[0]; // "3/2/2026"
      const horaParte = partes[1] || "00:00:00"; // "8:58:27"
      
      const [dia, mesNum, anio] = fechaParte.split('/');
      // Crear fecha en UTC: Date.UTC devuelve milisegundos desde epoch
      const [horas, minutos, segundos] = horaParte.split(':').map((x: string) => parseInt(x, 10));
      const timestamp = Date.UTC(
        parseInt(anio, 10),
        parseInt(mesNum, 10) - 1,  // Mes es 0-indexed en JavaScript
        parseInt(dia, 10),
        horas,
        minutos,
        segundos
      );
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        fechaLlamada = d.toISOString();
        fechaDate = d;
      }
    } catch (e) {
      console.log(`Error parsing fecha: ${marcaTemporal}`, e);
    }

    // Normalizar código NET
    const codigoNet = normalizarCodigoNet(codigoNetRaw);

    // ✅ CLAVE única para rastrear duplicados en batch
    const claveDuplicado = `${idAsesor}|${nombreCliente}|${mes}`;

    // ✅ VALIDACIÓN 0: Duplicado DENTRO del batch actual
    if (procesadosEnBatch.has(claveDuplicado)) {
      console.log(`[SHEETS] Duplicado en batch: ${nombreCliente} (${asesor})`);
      await db.none(
        `INSERT INTO llamadas_rechazadas (id_asesor, nombre_asesor, nombre_cliente, fecha_llamada, mes_referencia, motivo_rechazo, codigo_net)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idAsesor, nombreAsesor, nombreCliente, fechaDate.toISOString().split('T')[0], mes, 'Duplicado - Múltiples registros en mismo batch', codigoNet]
      );
      rechazados++;
      continue;
    }

    // ✅ VALIDACIÓN 1: Verificar duplicado - Mantener siempre el MES MÁS ANTIGUO
    const duplicado = await db.oneOrNone(
      `SELECT id, mes FROM llamadas_calidad 
       WHERE id_asesor = $1 AND nombre_cliente = $2`,
      [idAsesor, nombreCliente]
    );

    if (duplicado) {
      // Comparar meses: si el nuevo mes es anterior, actualizar
      if (mes < duplicado.mes) {
        // El nuevo mes es anterior (ej: 2026-03 < 2026-04), actualizar
        await db.none(
          `UPDATE llamadas_calidad 
           SET fecha_llamada = $1, mes = $2, codigo_net = $3
           WHERE id = $4`,
          [fechaLlamada, mes, codigoNet, duplicado.id]
        );
        sincronizados++;
      } else {
        // El nuevo mes es igual o posterior, rechazar
        await db.none(
          `INSERT INTO llamadas_rechazadas (id_asesor, nombre_asesor, nombre_cliente, fecha_llamada, mes_referencia, motivo_rechazo, codigo_net)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [idAsesor, nombreAsesor, nombreCliente, fechaDate.toISOString().split('T')[0], mes, 'Duplicado - Mes más reciente', codigoNet]
        );
        rechazados++;
      }
      continue;
    }

    // ✅ VALIDACIÓN 2: Verificar ventana de 6 días (mes + 6 días del siguiente mes)
    // Si es abril (2026-04), ventana = 1 abril 00:00 UTC a 6 mayo 23:59:59 UTC
    const [anioMes, mesMes] = mes.split('-').map(Number);
    const inicioVentana = new Date(Date.UTC(anioMes, mesMes - 1, 1, 0, 0, 0, 0));
    const finVentana = new Date(Date.UTC(anioMes, mesMes, 6, 23, 59, 59, 999));

    if (fechaDate < inicioVentana || fechaDate > finVentana) {
      // Rechazar fuera de rango
      console.log(`[DEBUG] Fuera de rango - Cliente: ${nombreCliente}, Fecha: ${fechaDate.toISOString()}, Mes: ${mes}, Ventana: ${inicioVentana.toISOString()} - ${finVentana.toISOString()}`);
      await db.none(
        `INSERT INTO llamadas_rechazadas (id_asesor, nombre_asesor, nombre_cliente, fecha_llamada, mes_referencia, motivo_rechazo, codigo_net)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idAsesor, nombreAsesor, nombreCliente, fechaDate.toISOString().split('T')[0], mes, 'Fuera de rango (mes + 6 días)', codigoNet]
      );
      rechazados++;
      continue;
    }

    // ✅ MARCAR como procesado en este batch
    procesadosEnBatch.add(claveDuplicado);

    // ✅ VALIDACIÓN PASSOU: Insertar en llamadas_calidad
    await db.none(
      `INSERT INTO llamadas_calidad (id_asesor, nombre_asesor, nombre_cliente, fecha_llamada, mes, codigo_net, fuente)
       VALUES ($1, $2, $3, $4, $5, $6, 'sheets')
       ON CONFLICT (id_asesor, nombre_cliente, mes) DO NOTHING`,
      [idAsesor, nombreAsesor, nombreCliente, fechaLlamada, mes, codigoNet]
    );
    sincronizados++;
  }

  console.log(`[SHEETS] Llamadas: ${sincronizados} sincronizadas, ${rechazados} rechazadas`);
  return { sincronizados, rechazados };
}

// Normalizar código NET: "NET15645", "15645", "net15645" → "NET15645"
function normalizarCodigoNet(codigoRaw: string): string {
  const limpio = codigoRaw.toUpperCase().replace(/\s+/g, '').replace(/^NET/, '');
  return /^\d+$/.test(limpio) ? `NET${limpio}` : codigoRaw;
}

// Sincronizar ambas pestañas
export async function sincronizarTodo(): Promise<{ prospectos: number; llamadas: number }> {
  console.log('[SHEETS] Iniciando sincronización con Google Sheets...');
  
  const p = await sincronizarProspectos();
  console.log('[SHEETS] Result from sincronizarProspectos:', p);
  
  const l = await sincronizarLlamadas();
  console.log('[SHEETS] Result from sincronizarLlamadas:', l);
  
  console.log('[SHEETS] Sincronización completa.');
  const resultado = { 
    prospectos: p.sincronizados, 
    llamadas: l.sincronizados
  };
  console.log(`[SHEETS] Retornando a bonoController:`, resultado);
  return resultado;
}

// DEBUG: Obtener filas de prospectos con datos parseados
export async function debugObtenerFilasProspectos(): Promise<any[]> {
  let filas = await obtenerFilas(TAB_PROSPECCION);
  
  // Ordenar igual que en sincronizar
  filas = filas.sort((a, b) => {
    const parseDate = (dateStr: string) => {
      try {
        const partes = dateStr.split(' ');
        const fechaParte = partes[0] || '';
        const [dia, mes, anio] = fechaParte.split('/');
        return Date.UTC(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      } catch {
        return 0;
      }
    };
    return parseDate(a[0] || '') - parseDate(b[0] || '');
  });

  // Retornar con columnas parseadas para debug
  return filas.map((fila, idx) => ({
    fila: idx + 2, // Número de fila en Google Sheets (desde fila 2)
    marcaTemporal: fila[0] || '',
    nombreCliente: fila[1] || '',
    mesTexto: fila[2] || '',
    asesor: fila[3] || '',
    col_e: fila[4] || '',
    direccion: fila[5] || '',
    col_g: fila[6] || ''
  }));
}

// Convierte:
// "FEBRERO 2026"  → "2026-02"  (formato PROSPECCION)
// "3. MARZO_26"   → "2026-03"  (formato LLAMADAS)
function convertirMesTextoAYYYYMM(mesTexto: string): string | null {
  const meses: Record<string, string> = {
    'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
    'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
    'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
  };

  const texto = mesTexto.trim().toUpperCase();

  // Formato "FEBRERO 2026"
  const m1 = texto.match(/^([A-Z]+)\s+(\d{4})$/);
  if (m1) {
    const numMes = meses[m1[1]];
    if (numMes) return `${m1[2]}-${numMes}`;
  }

  // Formato "3. MARZO_26" o "3.MARZO_26"
  const m2 = texto.match(/^\d+\.\s*([A-Z]+)[_\s](\d{2})$/);
  if (m2) {
    const numMes = meses[m2[1]];
    if (numMes) return `20${m2[2]}-${numMes}`;
  }

  return null;
}
