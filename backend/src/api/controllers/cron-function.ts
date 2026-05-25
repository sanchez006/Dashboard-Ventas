import comisionService from '../../services/comisionService';
import { db } from '../../db/connection';

/**
 * CRON AUTOMATICO: Calcular comisiones de todos los vendedores
 * Se ejecuta cada 13 a las 6pm (18:00)
 */
export const calcularComisionesAutomatico = async () => {
  try {
    console.log('\n🔄 [CRON] Iniciando calculo automatico de comisiones...');
    
    // Calcular mes anterior
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    console.log(`Mes anterior: ${mesAnterior.toLocaleDateString()}`);
    
    // Obtener vendedores activos
    const vendedoresResult = await db.query(
      `SELECT id_asesor, nombre FROM usuarios WHERE rol = 'vendedor' AND activo = true AND id_asesor IS NOT NULL`
    );
    
    let exitosos = 0, fallidos = 0;
    
    for (const vendedor of vendedoresResult) {
      try {
        const comision = await comisionService.calcularComisiones(
          vendedor.id_asesor,
          vendedor.nombre,
          mesAnterior
        );
        console.log(`✅ ${vendedor.nombre}: ${comision.cantidad_clientes} clientes`);
        exitosos++;
      } catch (err) {
        console.error(`❌ ${vendedor.nombre}:`, err);
        fallidos++;
      }
    }
    
    console.log(`Completado: ${exitosos} exitosos, ${fallidos} fallidos\n`);
  } catch (error) {
    console.error('Error en calculo automatico:', error);
  }
};
