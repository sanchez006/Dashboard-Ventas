# Frontend - Plataforma de Ventas

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts ✅
│   │   │   │   └── gamification.service.ts (por crear)
│   │   │   ├── guards/ (por crear)
│   │   │   └── interceptors/
│   │   │       └── api.interceptor.ts ✅
│   │   ├── shared/
│   │   │   ├── components/ (por crear)
│   │   │   └── pipes/ (por crear)
│   │   ├── features/
│   │   │   ├── dashboard/ ✅
│   │   │   ├── clientes/ ✅
│   │   │   ├── vendedores/ ✅
│   │   │   ├── alertas/ ✅
│   │   │   └── reportes/ ✅
│   │   ├── models/
│   │   │   ├── kpi.model.ts ✅
│   │   │   └── cliente.model.ts ✅
│   │   ├── app.component.ts ✅
│   │   └── app.routes.ts ✅
│   ├── styles/ (por crear)
│   ├── styles.scss ✅
│   ├── main.ts ✅
│   └── index.html ✅
├── package.json ✅
├── tsconfig.json ✅
├── angular.json ✅
└── README.md
```

## ✅ Lo que está hecho:

- ✅ Estructura de carpetas
- ✅ Configuración Angular (package.json, tsconfig, angular.json)
- ✅ Componentes principales (Dashboard, Clientes, Vendedores, Alertas, Reportes)
- ✅ Models/Interfaces (KPI, Cliente)
- ✅ API Service (conexión a backend)
- ✅ HTTP Interceptor

## 🚀 Próximos pasos:

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Ejecutar dev server:**
   ```bash
   npm start
   ```

3. **Desarrollar componentes:**
   - Componentes compartidos (KPI Card, Navbar, Loader)
   - Dashboard con gráficas (ngx-charts)
   - Listado de clientes con tabla
   - Ranking de vendedores
   - Alertas de vencimientos
   - Animaciones (Lottie)

4. **Gamificación:**
   - Mascota virtual
   - Sistema de puntos
   - Animaciones de celebración (confeti)
   - Notificaciones motivacionales

## 📦 Dependencias principales:

- `@angular/core`: Framework
- `@angular/material`: Components UI
- `ngx-charts`: Gráficas
- `lottie-web`: Animaciones
- `tailwindcss`: Estilos (opcional)

## 🔗 Conexión con Backend:

- **API URL**: `http://localhost:3000/api`
- Endpoints disponibles:
  - GET `/api/kpis` - KPIs del dashboard
  - GET `/api/clientes` - Listado de clientes
  - GET `/api/clientes/alertas/vencimientos` - Próximos vencimientos
  - GET `/api/clientes/resumen/por-estado` - Resumen por estado
