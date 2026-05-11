//este archivo es el punto de entrada del frontend, donde se configura la aplicación Angular, se definen las rutas, se importan los módulos necesarios y se inicia la aplicación en el navegador.
//inicia la aplicacion, carga componentes, configura rutas, habilita http para consumir API 

import { bootstrapApplication } from '@angular/platform-browser'; //inicia angular. dice cual es el componente principal (AppComponent) y que servicios/proveedores se van a usar en toda la app (rutas, animaciones, http)
import { provideAnimations } from '@angular/platform-browser/animations';//habilita animaciones en angular. Angular material, transiciones, efectos visuales, etc.
import { provideRouter } from '@angular/router';//activa el sistema de rutas tal como: /dashboard, /comisiones, /historico, etc.
import { provideHttpClient, withInterceptors } from '@angular/common/http'; //habilita el cliente HTTP para hacer solicitudes a la API backend. (sin esto angular no podría comunicarse con el servidor)
import { AppComponent } from './app/app.component'; //es el componente principal. el primer componente que se carga, el contenedor de toda la app
import { routes } from './app/app.routes'; //importa las rutas definidas 
import { apiInterceptor } from './app/core/interceptors/api.interceptor'; //interceptor para agregar el token de autenticación a las solicitudes HTTP. Esto permite que el frontend se comunique con la API de forma segura, enviando el token en cada solicitud para verificar la identidad del usuario y sus permisos. Sin este interceptor, el frontend no podría acceder a los endpoints protegidos de la API, lo que resultaría en errores de autenticación y autorización.

// El método bootstrapApplication es el punto de entrada para iniciar la aplicación Angular. Aquí se especifica que AppComponent es el componente raíz que se cargará inicialmente. 
// Además, se configuran los proveedores necesarios para toda la aplicación, incluyendo el sistema de rutas (provideRouter), las animaciones (provideAnimations) y 
// el cliente HTTP con su interceptor (provideHttpClient con withInterceptors). Esto asegura que la aplicación esté correctamente configurada para manejar la navegación, las animaciones y 
// las comunicaciones con la API backend desde el momento en que se inicia.
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([apiInterceptor])
    )
  ]
}).catch(err => console.error(err));
