const pgPromise = require('pg-promise');

const pgp = pgPromise();
const db = pgp('postgresql://postgres:centralizacion@localhost:5432/postgres');

async function analizarDatos() {
  try {
    console.log('📊 ANALIZANDO DATOS REALES DE CLIENTES\n');

    // 1. Ver qué vendedores/asesores tienen clientes reales
    const asesoresReales = await db.query(`
      SELECT DISTINCT id_asesor, nombre_asesor, COUNT(*) as cantidad_clientes
      FROM servicio_wisphub
      WHERE id_asesor IS NOT NULL AND nombre_asesor IS NOT NULL
      GROUP BY id_asesor, nombre_asesor
      ORDER BY cantidad_clientes DESC
    `);

    console.log('🏆 VENDEDORES CON CLIENTES REALES:\n');
    asesoresReales.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ID: ${row.id_asesor} | ${row.nombre_asesor} | ${row.cantidad_clientes} clientes`);
    });

    console.log(`\n✅ Total de asesores diferentes: ${asesoresReales.length}`);

    // 2. Buscar los 6 vendedores específicos
    console.log('\n🔍 Buscando los 6 vendedores específicos:\n');

    const vendedoresBuscados = [
      'ERWIN ALONZO',
      'FRANCISCO MENDEZ',
      'MELVI HERNANDEZ',
      'PATRICIA MEJIA',
      'RUDY HAZ',
      'THANIA PEREZ'
    ];

    for (const nombre of vendedoresBuscados) {
      const vendedor = asesoresReales.find(v => v.nombre_asesor && v.nombre_asesor.includes(nombre));
      if (vendedor) {
        console.log(`  ✅ ${nombre}: ENCONTRADO`);
        console.log(`     - ID en BD: ${vendedor.id_asesor}`);
        console.log(`     - Nombre en BD: ${vendedor.nombre_asesor}`);
        console.log(`     - Clientes: ${vendedor.cantidad_clientes}\n`);
      } else {
        console.log(`  ❌ ${nombre}: NO ENCONTRADO\n`);
      }
    }

    // 3. Mostrar muestra de datos de clientes
    console.log('\n📋 MUESTRA DE 3 CLIENTES CON SUS DATOS:\n');
    const muestraClientes = await db.query(`
      SELECT 
        id_servicio,
        nombre_cliente,
        email,
        id_asesor,
        nombre_asesor,
        precio_plan,
        estado_factura,
        estado
      FROM servicio_wisphub
      LIMIT 3
    `);

    muestraClientes.forEach((cliente, idx) => {
      console.log(`  Cliente ${idx + 1}:`);
      console.log(`    - ID Servicio: ${cliente.id_servicio}`);
      console.log(`    - Nombre: ${cliente.nombre_cliente}`);
      console.log(`    - Email: ${cliente.email}`);
      console.log(`    - Asesor ID: ${cliente.id_asesor}`);
      console.log(`    - Asesor: ${cliente.nombre_asesor}`);
      console.log(`    - Plan: Q${cliente.precio_plan}`);
      console.log(`    - Estado Factura: ${cliente.estado_factura}`);
      console.log(`    - Estado: ${cliente.estado}\n`);
    });

    await pgp.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await pgp.end();
    process.exit(1);
  }
}

analizarDatos();
