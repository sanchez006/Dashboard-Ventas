//este archivo sirve para manejar toda la lógica relacionada con la autenticación de usuarios, incluyendo el registro de nuevos usuarios, el proceso de login, la generación y verificación de tokens JWT, 
// y el cambio de contraseña. Este servicio se comunica con la base de datos para almacenar y recuperar información de los usuarios, y utiliza bibliotecas como bcrypt para el hashing de contraseñas y jsonwebtoken 
// para la gestión de tokens JWT. Es un componente clave para asegurar que solo los usuarios autorizados puedan acceder a ciertas partes de la aplicación y realizar acciones específicas según su rol (vendedor o admin).



import bcrypt from 'bcryptjs'; //sirve para encriptar contraseñas, compararlas sin guardarlos en texto plano (seguridad total)
import jwt from 'jsonwebtoken'; //sirve para crear y verificar tokens JWT, autenticar usuarios sin volver a pedir sus credenciales cada vez, manejar sesiones de usuario de forma segura y escalable
import { db } from '../db/connection'; // conexión a la base de datos para ejecutar consultas relacionadas con usuarios (registro, login, actualización de contraseña, etc.)
import { env } from '../config/env';

//define que datos llegan al backend cuando alguien hace login ejemplo: { email: 'juan@example.com', password: '123456' }
export interface LoginRequest {
  email: string;
  password: string;
}

// define que datos retorna el backend cuando alguien hace login exitosamente.  (nota que no se retorna el password ni el hash, solo datos necesarios para la sesión y el token)
export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: 'vendedor' | 'admin';
    id_asesor?: number;
  };
}

// esta clase encapsula toda la lógica de autenticación, desde el registro de usuarios hasta el manejo de tokens JWT y el cambio de contraseña. Esto permite mantener el código organizado y modular.
class AuthService {

  async registrarUsuario(  // esta función se encarga de registrar un nuevo usuario en la base de datos cuando un admin lo solicita. Recibe los datos necesarios para crear el usuario, como nombre, email, contraseña, rol y opcionalmente el id del asesor al que estará asociado (en caso de ser un vendedor).
    nombre: string,
    email: string,
    password: string,
    rol: 'vendedor' | 'admin' = 'vendedor',
    id_asesor?: number
  ): Promise<any> {
    try {
      // Hash de la contraseña
      const salt = await bcrypt.genSalt(10); // genera un salt aleatorio para mejorar la seguridad del hash de la contraseña. Esto hace que incluso si dos usuarios tienen la misma contraseña, sus hashes serán diferentes.
      const passwordHash = await bcrypt.hash(password, salt);// genera el hash de la contraseña utilizando bcrypt, combinando la contraseña con el salt generado.
      
       // Insertar nuevo usuario en la base de datos. La consulta SQL inserta un nuevo registro en la tabla "usuarios" con los datos proporcionados, incluyendo el nombre, email, hash de la contraseña, rol, id del asesor (si aplica) y establece el campo "activo" en true por defecto. Luego retorna los datos del usuario recién creado (sin el hash de la contraseña).
      const query = `
        INSERT INTO usuarios (nombre, email, password_hash, rol, id_asesor, activo) 
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id, nombre, email, rol, id_asesor
      `;

      const result = await db.query(query, [
        nombre,
        email,
        passwordHash,
        rol,
        id_asesor || null,
      ]);

      return result[0];
    } catch (error) {
      console.error('Error registrando usuario:', error);
      throw error;
    }
  }

  /**
   * Login - Validar email + contraseña y generar JWT
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log(`\n[LOGIN] Intentando login con: ${email}`);
      
      // 1. Buscar usuario por email
      const query = `
        SELECT id, nombre, email, password_hash, rol, id_asesor, activo
        FROM usuarios
        WHERE email = $1
      `;

      const result = await db.query(query, [email]);

      if (result.length === 0) {
        console.log(`[LOGIN] Usuario NO encontrado: ${email}`);
        throw new Error('Email o contraseña incorrectos');
      }

      const usuario = result[0];
      console.log(`[LOGIN] Usuario encontrado: ${usuario.nombre}, activo: ${usuario.activo}`);

      // 2. Validar que esté activo
      if (!usuario.activo) {
        console.log(`[LOGIN] Usuario desactivado: ${email}`);
        throw new Error('Usuario desactivado');
      }

      // 3. Verificar contraseña
      console.log(`[LOGIN] Comparando contraseña...`);
      console.log(`   Hash en BD: ${usuario.password_hash.substring(0, 20)}...`);
      
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);

      if (!passwordValida) {
        console.log(`[LOGIN] Contraseña INCORRECTA para: ${email}`);
        throw new Error('Email o contraseña incorrectos');
      }
    
      console.log(`[LOGIN] Contraseña CORRECTA para: ${email}`);
      
      // 4. Generar JWT
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          id_asesor: usuario.id_asesor,
        },
        'tu-super-secret-key-cambiar-en-env', // TODO: Usar variable de entorno
        { expiresIn: '24h' }
      );

      // 5. Actualizar último acceso
      await db.query(
        `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1`,
        [usuario.id]
      );

      console.log(`[LOGIN] Token generado exitosamente para: ${usuario.nombre}`);

      // 6. Retornar token + datos
      return {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          id_asesor: usuario.id_asesor,
        },
      };
    } catch (error) {
      console.error(`[LOGIN ERROR]:`, error);
      throw error;
    }
  }

  /**
   * Verificar token JWT
   */
  verificarToken(token: string): any {
    try {
      const decoded = jwt.verify(
        token,
        'tu-super-secret-key-cambiar-en-env'
      );
      return decoded;
    } catch (error) {
      console.error('Token inválido:', error);
      throw new Error('Token inválido o expirado');
    }
  }

  /**
   * Cambiar contraseña "buscar la ruta en el frontend"
   */
  async cambiarPassword(idUsuario: number, passwordAntigua: string, passwordNueva: string): Promise<boolean> {
    try {
      // 1. Obtener usuario
      const result = await db.query(
        `SELECT password_hash FROM usuarios WHERE id = $1`,
        [idUsuario]
      );

      if (result.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      // 2. Verificar contraseña antigua
      const passwordValida = await bcrypt.compare(
        passwordAntigua,
        result[0].password_hash
      );

      if (!passwordValida) {
        throw new Error('Contraseña antigua incorrecta');
      }

      // 3. Hash nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const nuevoHash = await bcrypt.hash(passwordNueva, salt);

      // 4. Actualizar
      await db.query(
        `UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [nuevoHash, idUsuario]
      );

      return true;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }
}

export default new AuthService();
