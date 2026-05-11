export interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: 'activo' | 'inactivo';
  fecha_registro: Date;
  total_clientes: number;
  total_ventas: number;
  meta_mensual: number;
  comision_porcentaje: number;
}

export interface VendedorRanking extends Vendedor {
  posicion: number;
  progreso_meta: number;
  desempeño: 'excelente' | 'bueno' | 'regular' | 'bajo';
}
