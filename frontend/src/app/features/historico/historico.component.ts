import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ComisionesService } from '../../core/services/comisiones.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss']
})
export class HistoricoComponent implements OnInit {
  usuarioActual: any;
  resumen5Meses: any[] = [];
  cargando = true;
  error: string | null = null;

  // Datos para el gráfico
  graficoMeses: string[] = [];
  graficoDatos: number[] = [];
  maxValor = 0;

  constructor(
    private comisionesService: ComisionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('📈 Componente Histórico inicializando...');
    this.usuarioActual = this.authService.getUsuario();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    console.log('🔄 Cargando resumen histórico...');

    this.comisionesService.obtenerMiResumen5Meses().toPromise()
      .then((resumen) => {
        console.log('✅ Datos históricos cargados:', resumen);

        // Convertir resumen de 5 meses
        this.resumen5Meses = (resumen?.data || []).map((mes: any) => ({
          ...mes,
          facturacion_total: parseFloat(mes.facturacion_total),
          monto_total_comisiones: parseFloat(mes.monto_total_comisiones),
          monto_bono: parseFloat(mes.monto_bono),
          monto_penalizacion: parseFloat(mes.monto_penalizacion),
          monto_total_neto: parseFloat(mes.monto_total_neto)
        }));

        // Actualizar gráfico
        this.actualizarGrafico();

        this.cargando = false;
      })
      .catch((err) => {
        console.error('❌ Error cargando datos históricos:', err);
        this.error = 'Error al cargar los datos históricos';
        this.cargando = false;
      });
  }

  /**
   * Actualizar datos del gráfico
   */
  actualizarGrafico(): void {
    if (!this.resumen5Meses || this.resumen5Meses.length === 0) {
      return;
    }

    // Extraer meses y cantidad de clientes
    this.graficoMeses = this.resumen5Meses.map(mes => {
      const fecha = new Date(mes.mes);
      return fecha.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    });

    this.graficoDatos = this.resumen5Meses.map(mes => mes.cantidad_clientes);
    this.maxValor = Math.max(...this.graficoDatos, 1);
  }

  /**
   * Obtener posición X,Y de un punto en el gráfico
   */
  getPosicionPunto(indice: number): {x: number, y: number} {
    const numPuntos = this.graficoDatos.length;
    const espacioX = 520 / (numPuntos - 1 || 1);
    const valor = this.graficoDatos[indice];
    
    const x = 40 + (indice * espacioX);
    const y = 260 - ((valor / this.maxValor) * 220);
    
    return {x, y};
  }

  /**
   * Generar string de puntos para polyline
   */
  generarPuntosLinea(): string {
    return this.graficoDatos.map((_, i) => {
      const pos = this.getPosicionPunto(i);
      return `${pos.x},${pos.y}`;
    }).join(' ');
  }

  /**
   * Generar string de puntos para el área bajo la línea
   */
  generarAreaBajoLinea(): string {
    let puntos = this.generarPuntosLinea();
    const ultimoIndice = this.graficoDatos.length - 1;
    const ultimaPos = this.getPosicionPunto(ultimoIndice);
    const primerPos = this.getPosicionPunto(0);
    
    puntos += ` ${ultimaPos.x},260 ${40},260 ${primerPos.x},${primerPos.y}`;
    return puntos;
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
   * Calcular total facturación
   */
  calcularTotalFacturacion(): number {
    return this.resumen5Meses.reduce((total, mes) => total + mes.facturacion_total, 0);
  }

  /**
   * Calcular total comisiones base
   */
  calcularTotalComisiones(): number {
    return this.resumen5Meses.reduce((total, mes) => total + mes.monto_total_comisiones, 0);
  }

  /**
   * Calcular total bonos
   */
  calcularTotalBonos(): number {
    return this.resumen5Meses.reduce((total, mes) => total + mes.monto_bono, 0);
  }

  /**
   * Calcular total penalizaciones
   */
  calcularTotalPenalizaciones(): number {
    return this.resumen5Meses.reduce((total, mes) => total + mes.monto_penalizacion, 0);
  }

  /**
   * Calcular total neto 5 meses
   */
  calcularTotalNeto(): number {
    return this.resumen5Meses.reduce((total, mes) => total + mes.monto_total_neto, 0);
  }
}
