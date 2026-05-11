export interface KPI {
  id: string;
  nombre: string;
  valor: number;
  meta: number;
  porcentaje: number;
  tendencia: 'arriba' | 'abajo' | 'estable';
  icon: string;
  color: string;
  descripcion: string;
}

export interface DashboardKPIs {
  totalVendedores: KPI;
  totalClientes: KPI;
  ventasDelMes: KPI;
  metaCumplida: KPI;
  npsScore: KPI;
  tasaChurn: KPI;
  ingresoRecurrente: KPI;
  clientesPorGanar: KPI;
}
