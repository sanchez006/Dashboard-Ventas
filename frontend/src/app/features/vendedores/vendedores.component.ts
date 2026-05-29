import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vendedores',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './vendedores.component.html',
  styleUrls: ['./vendedores.component.scss']
})
export class VendedoresComponent implements OnInit {
  esAdmin = false;

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  async verDetalleVendedor(vendedor: any) {
    // Obtener datos adicionales (llamadas, prospectos, incumplimientos)
    const [llamadas, prospectos, incumplimientos] = await Promise.all([
      this.apiService.getLlamadas?.(vendedor.id_asesor, this.mesActual)?.toPromise?.().then((r: any) => r?.data || []) ?? [],
      this.apiService.getProspectos?.(vendedor.id_asesor, this.mesActual)?.toPromise?.().then((r: any) => r?.data || []) ?? [],
      this.apiService.obtenerIncumplimientos?.(vendedor.id_asesor)?.toPromise?.().then((r: any) => r?.data || []) ?? []
    ]);
    this.dialog.open(
      (await import('../admin/vendedor-detalle-dialog.component')).VendedorDetalleDialogComponent,
      {
        width: '90vw',
        height: '90vh',
        data: {
          vendedor,
          llamadas,
          prospectos,
          incumplimientos
        }
      }
    );
  }
  vendedores: any[] = [];
  cargando = true;
  mesActual = new Date().toISOString().slice(0, 7);
  apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.esAdmin = this.authService.esAdmin();
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
