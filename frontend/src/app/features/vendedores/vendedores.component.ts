import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vendedores',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Desempeño de Vendedores</h1>
        <p class="subtitle">...</p>
      </div>

      <div *ngIf="cargando" class="loading">
        <mat-spinner></mat-spinner>
        <p>Cargando datos de vendedores...</p>
      </div>

      <div *ngIf="!cargando" class="vendedores-grid">
        <div *ngFor="let vendedor of vendedores" class="vendedor-wrapper">
          <mat-card class="vendedor-card">
            <div class="card-header">
              <h2>{{ vendedor.nombre }}</h2>
              <span class="badge" [ngClass]="'badge-' + (vendedor.porcentajeGlobal >= 40 ? 'success' : vendedor.porcentajeGlobal >= 30 ? 'warning' : 'danger')">
                {{ vendedor.porcentajeGlobal }}%
              </span>
            </div>

            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">Clientes</span>
                <span class="stat-value">{{ vendedor.clientes }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Facturación</span>
                <span class="stat-value">Q{{ (vendedor.facturacion | number:'1.2-2') }}</span>
              </div>
            </div>

            <!-- SVG CON 3 CAPAS CONCÉNTRICAS -->
            <svg viewBox="0 0 200 200" class="kpi-rings">
              <!-- CAPA 3: GLOBAL (90px) - Azul -->
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e0f2f7" stroke-width="2"></circle>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#0288d1" stroke-width="12" 
                      [style.stroke-dasharray]="calcularDasharray(vendedor.porcentajeGlobal, 90)" 
                      stroke-dashoffset="0" stroke-linecap="round"></circle>

              <!-- CAPA 2: META COMISIÓN (65px) - Rojo -->
              <circle cx="100" cy="100" r="65" fill="none" stroke="#ffebee" stroke-width="2"></circle>
              <circle cx="100" cy="100" r="65" fill="none" stroke="#e53935" stroke-width="12" 
                      [style.stroke-dasharray]="calcularDasharray(vendedor.porcentajePonderado, 65)" 
                      stroke-dashoffset="0" stroke-linecap="round"></circle>

              <!-- CAPA 1: BONO VARIABLE (40px) - Verde -->
              <circle cx="100" cy="100" r="40" fill="none" stroke="#e8f5e9" stroke-width="2"></circle>
              <circle cx="100" cy="100" r="40" fill="none" stroke="#43a047" stroke-width="12" 
                      [style.stroke-dasharray]="calcularDasharray(vendedor.porcentajeBono, 40)" 
                      stroke-dashoffset="0" stroke-linecap="round"></circle>
              
              <!-- Centro con porcentaje global -->
              <circle cx="100" cy="100" r="30" fill="#f5f5f5" opacity="0.9"></circle>
              <text x="100" y="105" text-anchor="middle" class="center-text">{{ vendedor.porcentajeGlobal }}%</text>
            </svg>

            <!-- LEYENDA -->
            <div class="legend">
              <div class="legend-item">
                <span class="color bono"></span>
                <div>
                  <span class="legend-label">Bono Variable</span>
                  <span class="legend-value">{{ vendedor.porcentajeBono }}%</span>
                </div>
              </div>
              <div class="legend-item">
                <span class="color comision"></span>
                <div>
                  <span class="legend-label">Meta Comisión</span>
                  <span class="legend-value">{{ vendedor.porcentajePonderado }}%</span>
                </div>
              </div>
              <div class="legend-item">
                <span class="color global"></span>
                <div>
                  <span class="legend-label">Global</span>
                  <span class="legend-value">{{ vendedor.porcentajeGlobal }}%</span>
                </div>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./vendedores.component.scss']
})
export class VendedoresComponent implements OnInit {
  vendedores: any[] = [];
  cargando = true;
  mesActual = new Date().toISOString().slice(0, 7);
  apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.cargarVendedores();
  }

  cargarVendedores(): void {
    // Obtener ranking de vendedores
    this.http.get<any>(`${this.apiUrl}/admin/ranking-vendedores`).subscribe({
      next: (ranking: any) => {
        const vendedoresData = ranking?.data || [];
        
        // Para cada vendedor, obtener sus métricas
        Promise.all(
          vendedoresData.map((v: any) => this.obtenerMetricasVendedor(v))
        ).then((vendedoresCompletos) => {
          this.vendedores = vendedoresCompletos;
          this.cargando = false;
        });
      },
      error: (err: any) => {
        console.error('Error cargando vendedores:', err);
        this.cargando = false;
      }
    });
  }

  private obtenerMetricasVendedor(vendedor: any): Promise<any> {
    const idAsesor = vendedor.id_asesor || vendedor.id;
    
    return Promise.all([
      // Obtener comisiones REALES usando ruta de ADMIN
      this.http.get<any>(`${this.apiUrl}/comisiones/admin/${idAsesor}/${this.mesActual}`).toPromise(),
      // Obtener bono del mes
      this.apiService.getBonoTotal(idAsesor, this.mesActual).toPromise(),
    ]).then(([comisionesResponse, bonoResponse]) => {
      // Extraer datos de comisiones - puede ser array u objeto
      let comisionDelMes: any = null;
      if (comisionesResponse?.data) {
        comisionDelMes = Array.isArray(comisionesResponse.data) 
          ? comisionesResponse.data[0] 
          : comisionesResponse.data;
      }

      const bonoData = bonoResponse?.data || {};
      
      // Obtener valores reales del mes
      const clientes = comisionDelMes?.cantidad_clientes || 0;
      const facturacion = comisionDelMes?.facturacion_total || 0;
      
      // Calcular porcentajes reales
      const porcentajeBono = (bonoData.prospeccion?.porcentaje || 0) * 0.60 + 
                            (bonoData.llamadas?.porcentaje || 0) * 0.25 + 
                            (bonoData.rh?.porcentaje || 0) * 0.15;
      
      // Facturación % basado en meta (Q4,000)
      const META_COMISION = 4000;
      const porcentajeFacturacion = Math.min((facturacion / META_COMISION) * 100, 100);
      
      // Global = promedio de bono y facturación
      const porcentajeGlobal = (porcentajeBono + porcentajeFacturacion) / 2;

      console.log(`${vendedor.nombre}: ${clientes} clientes, Q${facturacion}, Bono: ${porcentajeBono.toFixed(2)}%, Fact: ${porcentajeFacturacion.toFixed(2)}%, Global: ${porcentajeGlobal.toFixed(2)}%`);

      return {
        nombre: vendedor.nombre,
        id_asesor: idAsesor,
        clientes: clientes,
        facturacion: facturacion,
        porcentajeBono: Math.round(porcentajeBono),
        porcentajePonderado: Math.round(porcentajeFacturacion),
        porcentajeFacturacion: Math.round(porcentajeFacturacion),
        porcentajeGlobal: Math.round(porcentajeGlobal)
      };
    });
  }

  calcularDasharray(porcentaje: number, radio: number): string {
    const circunferencia = 2 * Math.PI * radio;
    const usado = (porcentaje / 100) * circunferencia;
    return `${usado} ${circunferencia}`;
  }
}
