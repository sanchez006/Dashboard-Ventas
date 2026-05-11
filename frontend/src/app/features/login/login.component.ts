// este archivo define el componente de login, que es la pantalla donde los usuarios ingresan sus credenciales para acceder a la aplicación. Este componente utiliza un formulario reactivo para capturar el email y la contraseña
// del usuario, y se comunica con el AuthService para realizar el proceso de autenticación. Si el login es exitoso, redirige al usuario a la página correspondiente según su rol (admin o vendedor). 
// También maneja estados de carga y errores para mejorar la experiencia del usuario durante el proceso de login.


import { Component, OnInit } from '@angular/core'; //permite definir un componente de Angular, que es una pieza reutilizable de la interfaz de usuario. El decorador @Component se usa para configurar el componente.
import { CommonModule } from '@angular/common'; //proporciona directivas comunes como ngIf, ngFor, etc. que se pueden usar en la plantilla del componente para mostrar u ocultar elementos, iterar sobre listas, etc.
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';// habilita el uso de formularios reactivos en Angular, lo que permite crear y gestionar formularios de manera programática, incluyendo validaciones y manejo de estados del formulario.
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Router } from '@angular/router';//sirve para navegar programáticamente entre diferentes rutas de la aplicación, como redirigir al usuario al dashboard después de un login exitoso.
import { AuthService } from '../../core/services/auth.service'; //importa el servicio de autenticación para manejar el proceso de login, verificar si el usuario ya está logueado, etc.

// El decorador @Component define la configuración del componente, incluyendo su selector (app-login), las dependencias que importa (CommonModule, ReactiveFormsModule, Angular Material).
@Component({  
  selector: 'app-login',
  standalone: true, //angular moderno. no necesita modulo, es mas simple y mas rapido

  //modulos que este componente necesita para funcionar (solo para este componente, no para toda la app)
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html', //ruta de la plantilla HTML del componente (todo lo que se ve en pantalla, el formulario, los botones, los mensajes de error, etc.)
  styleUrls: ['./login.component.scss'],//ruta de los estilos específicos para este componente (colores, tamaños, disposición, etc. para el html)
})

// La clase LoginComponent contiene la lógica del componente, incluyendo la definición del formulario, el manejo del proceso de login, y la navegación después del login.
export class LoginComponent implements OnInit {
  loginForm: FormGroup; // representa el formulario de login, con campos para email y contraseña, y sus respectivas validaciones.
  cargando = false; //indica si el proceso de login está en curso, para mostrar un spinner de carga y evitar múltiples envíos del formulario.
  error: string | null = null; //almacena el mensaje de error en caso de que el login falle

  // El constructor inyecta los servicios necesarios para el funcionamiento del componente.  
  constructor(
    private fb: FormBuilder,//crea el formulario de login de manera programática, definiendo los campos y sus validaciones.
    private authService: AuthService,//permite acceder a las funciones de autenticación, como el proceso de login, verificar si el usuario ya está logueado, etc.
    private router: Router//navega a otras páginas después del login, como el dashboard o la página de admin según el rol del usuario.
  ) {
    // crea el formularion con validaciones. usuario obligado, password obligatorio y mínimo 6 caracteres, rememberMe opcional.
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }
  //se ejecuta cuando el componente se inicializa. Aquí se verifica si el usuario ya está logueado (por ejemplo, si hay un token válido en localStorage). 
  ngOnInit(): void {
    // Si ya está logueado, ir al dashboard
    if (this.authService.estaLogueado()) {  //verifica si el usuario ya tiene un token válido, lo que indicaría que ya está logueado. Esto es útil para evitar que el usuario tenga que ingresar sus credenciales denuevo
      console.log('Ya estaba logueado, ir a comisiones');
      this.router.navigate(['/comisiones']);// si el usuario ya está logueado, lo redirige automáticamente a la página de comisiones.
      return;
    }

    console.log('No logueado, mostrar login');
  }

  /**
   * Enviar login
   */
  onLogin(): void { // se ejcuta caudnoe el usuario le da click al boton 
    if (this.loginForm.invalid) { //verifica si el formulario es válido antes de intentar hacer login.
      return;
    }

    this.cargando = true; //indica que el proceso de login está en curso, lo que puede usarse para mostrar un spinner de carga y deshabilitar el botón de login para evitar múltiples envíos.
    this.error = null; //reinicia el mensaje de error antes de intentar hacer login, para limpiar cualquier error anterior que pueda haber quedado en la pantalla.

    const { username, password, rememberMe } = this.loginForm.value;//extrae los valores de username, password y rememberMe del formulario para enviarlos al servicio de autenticación.

    //llama al backend a través del AuthService para intentar hacer login con las credenciales proporcionadas. Si el login es exitoso, redirige al usuario a la página correspondiente según su rol (admin o vendedor). 
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.cargando = false;
        
        // Si el usuario marcó "Recuérdame", guardar el usuario
        if (rememberMe) {
          localStorage.setItem('remembered_user', username);
        } else {
          localStorage.removeItem('remembered_user');
        }
        
        // Ir al dashboard según rol
        if (response.usuario.rol === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.cargando = false;
        this.error = error.error?.error || 'Error en login. Verifica tus credenciales.';
      },
    });
  }

  /**
   * Obtener control del formulario (para la vista)
   */
  get username() {
    return this.loginForm?.get('username');
  }

  get password() {
    return this.loginForm?.get('password');
  }

  get rememberMe() {
    return this.loginForm?.get('rememberMe');
  }
}
