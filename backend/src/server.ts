import express from 'express'; // Importar express para crear el servidor y manejar rutas(sirve para crear el servido y definir las rutas de la API)
import cors from 'cors'; // Importar cors para manejar las políticas de CORS y permitir solicitudes desde el frontend sin que se bloquee por el navegador)
import dotenv from 'dotenv'; // Importar dotenv para leer las variables de entorno desde un archivo .env
import { env } from './config/env'; // Importar las variables de entorno desde el archivo de configuración (config/env.ts)
import { db } from './db/connection'; //aunque no se use directamente aquí, esto asegura que la conexión a la base de datos se establezca al iniciar el servidor

//endpoints cada uno de estos archivos define rutas específicas para manejar las solicitudes relacionadas con clientes, KPIs, comisiones y autenticación.
import clientesRoutes from './api/routes/clientes.routes'
import kpisRoutes from './api/routes/kpis.routes';
import comisionesRoutes from './api/routes/comisiones.routes';
import authRoutes from './api/routes/auth.routes';
import bonoRoutes from './api/routes/bono.routes';
import cron from 'node-cron';
import { sincronizarTodo } from './services/googleSheetsService';
// import vendedoresRoutes from './api/routes/vendedores.routes'; // Desactivado por ahora

dotenv.config(); // lee el archivo .env y carga sus valores en el sistema ejemplo: DB_HOST, DB_USER, DB_PASSWORD, PORT, etc.


const app = express(); // aqui se crea la app que es el servidor.. el punto central de todo
const PORT = env.PORT; // Puerto en el que el servidor escuchará las solicitudes, obtenido de las variables de entorno 

// Middleware (funciones que se ejecutan antes de las rutas)

//permite que solo ciertos origenes puedan hacer solicitudes a la API, en este caso el frontend que corre en http://localhost:4200 o el valor definido en CORS_ORIGIN
app.use(cors({
  origin: env.CORS_ORIGIN
}));
app.use(express.json()); // Permite que el servidor entienda las solicitudes con cuerpo en formato JSON, lo cual es común en APIs RESTful. Sin esto, el servidor no podría procesar correctamente los datos enviados desde el frontend.

// verificar que la API está funcionando correctamente
app.get('/api/health', (req, res) => {
  res.json({ status: 'API funcionando correctamente' });
});

// registro de rutas principales de la API cada una de estas rutas se encarga de manejar las solicitudes relacionadas con su respectiva funcionalidad (clientes, KPIs, comisiones, autenticación)
// cada modulo tiene su logica, sus endpoints y sus controladores para manejar las solicitudes y respuestas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/kpis', kpisRoutes);
app.use('/api/comisiones', comisionesRoutes);
app.use('/api/bono', bonoRoutes);

// Endpoint para sincronización manual desde el frontend
app.post('/api/bono/sincronizar', async (req, res) => {
  try {
    const result = await sincronizarTodo();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error en sincronización manual:', error);
    res.status(500).json({ success: false, error: 'Error al sincronizar' });
  }
});

// Cron job: sincronizar cada hora automáticamente
cron.schedule('0 * * * *', async () => {
  try {
    await sincronizarTodo();
  } catch (error) {
    console.error('Error en cron de sincronización:', error);
  }
});
// app.use('/api/vendedores', vendedoresRoutes); // Desactivado: tabla vendedores no existe aún

//  manejo de error. si ocurre un error no se cae el servidor, se muestra un mensaje controlado 
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor.empieza a escuchar peticiones, muestra informacion en consola
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`CORS activado para: ${env.CORS_ORIGIN}`);
});

export default app; // Exportamos la app para poder usarla en pruebas u otros módulos si es necesario
