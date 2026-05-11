
// importamos pg-promise para manejar la conexión a PostgreSQL
import pgPromise from 'pg-promise';
import { env } from '../config/env'; // Importamos las variables de entorno (config/env.ts))

const pgp = pgPromise(); // Inicializamos pg-promise con la configuración de la base de datos

// Creamos la conexión a la base de datos utilizando las variables de entorno
const db = pgp({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

// Verificar conexión
db.connect()
  .then(obj => {
    console.log('Conexión a PostgreSQL exitosa');
    obj.done(); // Liberar conexión
  })
  .catch(error => { // Manejar errores de conexión si ocurre alguno 
    console.error('Error al conectar a PostgreSQL:', error.message);
  });

export { db, pgp }; // Exportamos la conexión y pg-promise para usar en otras partes de la aplicación
