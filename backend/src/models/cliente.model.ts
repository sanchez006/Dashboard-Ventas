export interface Cliente {
  id_servicio: number;
  usuario: string;
  nombre_cliente: string;
  email: string;
  telefono: string;
  direccion: string;
  municipio: string;
  estado: 'Activo' | 'Cancelado' | 'Gratis' | 'Suspendido';
  precio_plan: number;
  estado_factura: string;  // 'Pagadas', 'Pendiente', 'Vencido', etc
  fecha_instalacion: Date;
  fecha_corte: Date;
  nombre_plan: string;
  nombre_zona: string;
  id_asesor?: number;
  nombre_asesor?: string;
  forma_contratacion: string;
}

export interface ClienteDetalle extends Cliente {
  coordenada: string;
  id_tecnico?: number;
  nombre_tecnico?: string;
}
