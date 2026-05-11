# Backend - Plataforma de Ventas

## 🚀 Inicio rápido

### Requisitos
- Node.js 18+
- PostgreSQL (Docker o instalado)
- npm o yarn

### Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copiar `.env.example` a `.env` y ajustar valores:
   ```bash
   cp .env.example .env
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

   El servidor estará disponible en: `http://localhost:3000`

4. **Build para producción:**
   ```bash
   npm run build
   npm start
   ```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts ✅ - Variables de entorno
│   ├── db/
│   │   └── connection.ts ✅ - Conexión PostgreSQL
│   ├── models/
│   │   ├── cliente.model.ts ✅
│   │   ├── kpi.model.ts ✅
│   │   ├── vendedor.model.ts ✅
│   │   └── gamification.model.ts ✅
│   ├── services/
│   │   ├── clienteService.ts ✅
│   │   ├── kpiService.ts ✅
│   │   └── vendedorService.ts ⏳
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── clienteController.ts ✅
│   │   │   ├── kpiController.ts ✅
│   │   │   └── vendedorController.ts ⏳
│   │   └── routes/
│   │       ├── clientes.routes.ts ✅
│   │       ├── kpis.routes.ts ✅
│   │       └── vendedores.routes.ts ⏳
│   └── server.ts ✅ - Express app y middleware
├── package.json ✅
├── tsconfig.json ✅
└── README.md
```

## 📊 Endpoints Disponibles

### KPIs
- **GET** `/api/kpis` - Obtener todos los KPIs
  - Respuesta: `{ success: boolean, data: DashboardKPIs }`
- **GET** `/api/kpis/:id` - Obtener KPI específico

### Clientes
- **GET** `/api/clientes?limit=100&offset=0` - Listado con paginación
- **GET** `/api/clientes/:id` - Obtener cliente por ID
- **GET** `/api/clientes/estado/:estado` - Filtrar por estado (Activo, Cancelado, etc)
- **GET** `/api/clientes/alertas/vencimientos?dias=30` - Próximos vencimientos
- **GET** `/api/clientes/resumen/por-estado` - Resumen estadístico

### Vendedores
- **GET** `/api/vendedores` - Listado de vendedores (⏳ tabla no existe aún)
- **GET** `/api/vendedores/:id` - Obtener vendedor por ID

## 🗄️ Base de Datos

**Tabla Principal:** `servicio_wisphub`

Contiene todos los datos consolidados:
- Información del cliente (nombre, email, teléfono, dirección)
- Plan y estado del servicio (activo, cancelado, etc)
- Datos de facturación y vencimiento
- Información de asesor y técnico
- Coordenadas geográficas

**Total de registros:** 14,914+

## 🔧 Tecnologías

- **Express.js 4.18.2** - Framework web
- **TypeScript 5.3.3** - Lenguaje
- **pg-promise 11.5.4** - ORM para PostgreSQL
- **dotenv** - Gestión de variables de entorno
- **CORS** - Habilitado para frontend

## 📝 Ejemplo de Request

```bash
# Obtener todos los KPIs
curl http://localhost:3000/api/kpis

# Obtener clientes con paginación
curl "http://localhost:3000/api/clientes?limit=10&offset=0"

# Obtener próximos vencimientos en 30 días
curl "http://localhost:3000/api/clientes/alertas/vencimientos?dias=30"
```

## ⚠️ Notas Importantes

- La tabla `vendedores` no existe en la BD (comentada en servicios)
- CORS configurado para `http://localhost:4200` (frontend)
- En producción, ajustar `.env` con URLs reales

## 🐛 Debugging

Para ver logs detallados, verificar:
- Console del servidor con `npm run dev`
- Respuestas HTTP con Postman o curl
- Variables de entorno en `.env`
