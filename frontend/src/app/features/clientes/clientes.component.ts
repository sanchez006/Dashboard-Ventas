import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ComisionesService } from '../../core/services/comisiones.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit, OnDestroy {
  usuarioActual: any;
  clientes: any[] = [];
  cargando = true;
  error: string | null = null;
  
  // Auto-actualización cada 10 minutos
  autoRefreshInterval: any;
  REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutos
  ultimaActualizacion: Date = new Date();
  
  // Para usar Date en el template
  Date = Date;

  constructor(
    private comisionesService: ComisionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('👥 Componente Clientes inicializando...');
    this.usuarioActual = this.authService.getUsuario();
    this.cargarDatos();
    
    // Auto-actualizar cada 10 minutos
    this.autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-actualización de clientes...');
      this.cargarDatos();
    }, this.REFRESH_INTERVAL);
  }

  ngOnDestroy(): void {
    // Limpiar intervalo al destruir componente
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    console.log('🔄 Cargando clientes históricos...');

    this.comisionesService.obtenerClientesHistorico().toPromise()
      .then((clientes) => {
        console.log('✅ Clientes históricos cargados:', clientes);

        // Convertir clientes
        this.clientes = (clientes?.data || []).map((cliente: any) => ({
          ...cliente,
          precio_plan: parseFloat(cliente.precio_plan)
        }));
        
        // Actualizar timestamp
        this.ultimaActualizacion = new Date();

        this.cargando = false;
      })
      .catch((err) => {
        console.error('❌ Error cargando clientes:', err);
        this.error = 'Error al cargar los clientes';
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
   * Calcular suma de pendientes
   */
  calcularSumaPendientes(): number {
    return this.obtenerClientesPendientes().reduce((sum, c) => sum + (Number(c.precio_plan) || 0), 0);
  }

  /**
   * Obtener solo clientes con "Pendiente de Pago"
   */
  obtenerClientesPendientes(): any[] {
    return this.clientes.filter(cliente => cliente.estado_factura === 'Pendiente de Pago');
  }

  /**
   * Calcular suma de facturación
   */
  calcularSumaFacturacion(): string {
    const suma = this.clientes.reduce((total, cliente) => {
      return total + (cliente.precio_plan || 0);
    }, 0);
    return this.formatearMoneda(suma);
  }
}
