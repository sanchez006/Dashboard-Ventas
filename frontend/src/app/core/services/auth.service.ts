// este archivo sirve para manejar toda la lógica relacionada con la autenticación de usuarios, incluyendo el registro de nuevos usuarios, el proceso de login, la generación y verificación de tokens JWT,

import { Injectable } from '@angular/core'; //permite que esta clase se pueda inyectar como un servicio en otros componentes o servicios de Angular, facilitando la reutilización y la gestión de dependencias.
import { HttpClient } from '@angular/common/http';//sirve para hacer solicitudes HTTP al backend, como enviar las credenciales de login, registrar nuevos usuarios, etc.
import { BehaviorSubject, Observable } from 'rxjs'; //rxjs permite manejar estado reactivo. behaviorSubject guarda el valor actual y lo emite, Observable es algo que los componentes pueden escuchar 
import { tap } from 'rxjs/operators'; //tap permite ejecutar código adicional (como guardar el token en localStorage) sin modificar la respuesta original del Observable.
import { environment } from '../../../environments/environment';// importa las variables de entorno definidas en el archivo environment.ts, como la URL base de la API backend.

//define que datos llegan al backend cuando alguien hace login
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'vendedor' | 'admin';
  id_asesor?: number;
}

//define que datos retorna el backend cuando alguien hace login exitosamente.  (nota que no se retorna el password ni el hash, solo datos necesarios para la sesión y el token)
export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

// significa que el servicio de autenticación estará disponible en toda la aplicación (providedIn: 'root'),
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  // Observable para saber en tiempo real si está logueado
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable(); 

  // Observable se usa para interceptores y otros componentes que necesitan el token en tiempo real (ej: para saber si el usuario está logueado o no)
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Al iniciar, verificar si hay token guardado
    this.cargarToken();
  }

  /**
   * Login - Enviar email y contraseña al backend, recibir token y datos del usuario, guardarlos en localStorage y actualizar los observables para que toda la app sepa que el usuario está logueado.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          // Guardar token en localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
          
          // Actualizar subjects
          this.tokenSubject.next(response.token);
          this.usuarioSubject.next(response.usuario);
          
          console.log('Login exitoso, token guardado');
        })
      );
  }

  /**
   * Cargar token desde localStorage al iniciar la app
   */
  private cargarToken(): void {
    const token = localStorage.getItem('token');
    const usuarioJson = localStorage.getItem('usuario');
    
    console.log('Verificando localStorage...');
    console.log('Token:', token ? 'Existe' : 'NO existe');
    
    if (token) {
      this.tokenSubject.next(token);
    }
    
    if (usuarioJson) {
      try {
        const usuario = JSON.parse(usuarioJson);
        this.usuarioSubject.next(usuario);
        console.log('Usuario cargado:', usuario.email);
      } catch (e) {
        console.error('Error parseando usuario:', e);
      }
    }
  }

  /**
   * Logout - Limpiar todo
   */
  logout(): void {
    console.log('Logout - Limpiando todo');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.clear(); // Limpiar TODO
    this.tokenSubject.next(null);
    this.usuarioSubject.next(null);
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtener usuario actual
   */
  getUsuario(): Usuario | null {
    const usuarioJson = localStorage.getItem('usuario');
    if (!usuarioJson) return null;
    
    try {
      return JSON.parse(usuarioJson);
    } catch (e) {
      return null;
    }
  }

  /**
   * ¿Está logueado?
   */
  estaLogueado(): boolean {
    const token = !!this.getToken();
    console.log('¿Está logueado?', token);
    return token;
  }

  /**
   * ¿Es admin?
   */
  esAdmin(): boolean {
    const usuario = this.getUsuario();
    return usuario?.rol === 'admin';
  }

  /**
   * ¿Es vendedor?
   */
  esVendedor(): boolean {
    const usuario = this.getUsuario();
    return usuario?.rol === 'vendedor';
  }

  /**
   * Obtener ID del asesor (para vendedores)
   */
  getIdAsesor(): number | null {
    const usuario = this.getUsuario();
    return usuario?.id_asesor || null;
  }
}
