import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ComisionesService } from '../../core/services/comisiones.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  usuarioActual: any;
  comisionesMes: any;
  resumen5Meses: any[] = [];
  clientes: any[] = [];
  cargando = true;
  error: string | null = null;

  mesSeleccionado: string = new Date().toISOString().slice(0, 7);
  mesesDisponibles: { valor: string; etiqueta: string }[] = [];

  displayedColumnsClientes = ['nombre_cliente', 'nombre_plan', 'precio_plan', 'estado_factura'];

  constructor(
    private comisionesService: ComisionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('📊 Dashboard inicializando...');
    this.usuarioActual = this.authService.getUsuario();
    this.generarMesesDisponibles();
    this.cargarDatos();
  }

  generarMesesDisponibles(): void {
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      this.mesesDisponibles.push({
        valor: d.toISOString().slice(0, 7),
        etiqueta: `${nombres[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    this.mesSeleccionado = hoy.toISOString().slice(0, 7);
  }

  cambiarMes(mes: string): void {
    this.mesSeleccionado = mes;
    this.cargarDatos();
  }

  getMesEtiqueta(): string {
    return this.mesesDisponibles.find(m => m.valor === this.mesSeleccionado)?.etiqueta || this.mesSeleccionado;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    console.log('🔄 Cargando datos del vendedor...');

    // Cargar 3 solicitudes en paralelo
    Promise.all([
      this.comisionesService.obtenerMisComisiones(this.mesSeleccionado).toPromise(),
      this.comisionesService.obtenerMiResumen5Meses().toPromise(),
      this.comisionesService.obtenerMisClientes(this.mesSeleccionado).toPromise()
    ])
      .then(([comisiones, resumen, clientes]) => {
        console.log('✅ Datos cargados:', { comisiones, resumen, clientes });

        // Obtener la comisión del mes actual (último elemento)
        this.comisionesMes = comisiones?.data?.[0] || null;
        
        // Convertir strings numéricos a números si es necesario
        if (this.comisionesMes) {
          this.comisionesMes.facturacion_total = parseFloat(this.comisionesMes.facturacion_total);
          this.comisionesMes.monto_total_comisiones = parseFloat(this.comisionesMes.monto_total_comisiones);
          this.comisionesMes.monto_bono = parseFloat(this.comisionesMes.monto_bono);
          this.comisionesMes.monto_penalizacion = parseFloat(this.comisionesMes.monto_penalizacion);
          this.comisionesMes.monto_total_neto = parseFloat(this.comisionesMes.monto_total_neto);
        }

        // Convertir resumen de 5 meses
        this.resumen5Meses = (resumen?.data || []).map((mes: any) => ({
          ...mes,
          facturacion_total: parseFloat(mes.facturacion_total),
          monto_total_comisiones: parseFloat(mes.monto_total_comisiones),
          monto_bono: parseFloat(mes.monto_bono),
          monto_penalizacion: parseFloat(mes.monto_penalizacion),
          monto_total_neto: parseFloat(mes.monto_total_neto)
        }));

        // Convertir clientes
        this.clientes = (clientes?.data || []).map((cliente: any) => ({
          ...cliente,
          precio_plan: parseFloat(cliente.precio_plan)
        }));

        this.cargando = false;
      })
      .catch((err) => {
        console.error('❌ Error cargando datos:', err);
        this.error = 'Error al cargar los datos';
        this.cargando = false;
      });
  }

  /**
   * Formatear moneda
   */
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(valor || 0);
  }

  /**
   * Obtener color según estado de factura
   */
  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'Pagadas':
        return '#4caf50';
      case 'Pendiente de Pago':
        return '#ff9800';
      case 'Vencido':
        return '#f44336';
      default:
        return '#999';
    }
  }

  /**
   * Obtener color según estado del servicio
   */
  obtenerColorEstadoServicio(estado: string): string {
    switch (estado) {
      case 'Activo':
        return '#4caf50';
      case 'Suspendido':
        return '#ff9800';
      case 'Cancelado':
        return '#f44336';
      default:
        return '#999';
    }
  }

  /**
   * Calcular suma de facturación
   */
  calcularSumaFacturacion(): string {
    const suma = this.clientes.reduce((total, cliente) => {
      return total + (parseFloat(cliente.precio_plan) || 0);
    }, 0);
    return this.formatearMoneda(suma);
  }
}
