import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  usuarioActual: any;
  cargando = true;

  // Vendedores con sus métricas
  vendedores: any[] = [];
  mesSeleccionado: string = new Date().toISOString().slice(0, 7);

  // Para usar Math en el template
  Math = Math;
  isNaN = isNaN;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    console.log('Admin Dashboard inicializando...');
    // Siempre establecer el mes actual
    this.mesSeleccionado = new Date().toISOString().slice(0, 7);
    this.usuarioActual = this.authService.getUsuario();
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    console.log('=== CARGANDO DATOS PARA MES: ' + this.mesSeleccionado + ' ===');

    // Primero obtener lista de vendedores (solo para tener los nombres)
    this.adminService.obtenerRankingVendedores().toPromise()
      .then((ranking) => {
        console.log('Vendedores obtenidos:', ranking);
        const vendedoresBasicos = ranking?.data || [];
        
        if (vendedoresBasicos.length > 0) {
          console.log('Estructura:', Object.keys(vendedoresBasicos[0]));
        }

        // Para cada vendedor, CALCULAR comisiones en tiempo real
        return Promise.all(
          vendedoresBasicos.map((v: any) => {
            const idAsesor = v.id_asesor || v.id_vendedor || v.id;
            const nombreVendedor = v.nombre;
            console.log('Calculando comisiones de ' + nombreVendedor + ' (ID: ' + idAsesor + ') para mes ' + this.mesSeleccionado);
            
            // CALCULAR comisiones en tiempo real basado en clientes instalados
            return this.adminService.calcularComisionesVendedor(idAsesor, nombreVendedor, this.mesSeleccionado).toPromise()
              .then((resultado: any) => {
                console.log('Comisiones calculadas para ' + nombreVendedor + ':', resultado);
                
                let comisionData = {
                  nombre: nombreVendedor,
                  id_asesor: idAsesor,
                  facturacion_total: 0,
                  total_clientes_mes: 0,
                  bonoData: null,
                  porcentajePonderado: 0,
                  porcentajeFacturacion: 0,
                  porcentajeGlobal: 0
                };
                
                // Asignar datos del cálculo realizado
                if (resultado) {
                  comisionData.facturacion_total = resultado.facturacion_total || 0;
                  comisionData.total_clientes_mes = resultado.cantidad_clientes || 0;
                  console.log('✅ Calculado para ' + nombreVendedor + ': Facturación=' + comisionData.facturacion_total + ', Clientes=' + comisionData.total_clientes_mes);
                } else {
                  console.log('❌ No se pudo calcular comisión para ' + nombreVendedor);
                }
                
                // Obtener bono del mes
                return this.apiService.getBonoTotal(idAsesor, this.mesSeleccionado).toPromise()
                  .then((bono: any) => {
                    console.log('Respuesta COMPLETA bono de ' + comisionData.nombre + ' en ' + this.mesSeleccionado + ':', bono);
                    if (bono?.data) {
                      console.log('Estructura bonoData:', Object.keys(bono.data));
                      console.log('bonoData.prospeccion:', bono.data.prospeccion);
                      console.log('bonoData.llamadas:', bono.data.llamadas);
                      console.log('bonoData.rh:', bono.data.rh);
                    }
                    comisionData.bonoData = bono?.data;
                    this.calcularMetricasVendedor(comisionData);
                    return comisionData;
                  });
              })
              .catch((error) => {
                console.error('Error calculando comisión para ' + nombreVendedor + ':', error);
                return {
                  nombre: nombreVendedor,
                  id_asesor: idAsesor,
                  facturacion_total: 0,
                  total_clientes_mes: 0,
                  bonoData: null,
                  porcentajePonderado: 0,
                  porcentajeFacturacion: 0,
                  porcentajeGlobal: 0
                };
              });
          })
        );
      })
      .then((vendedoresCompletos) => {
        this.vendedores = vendedoresCompletos;
        console.log('=== DATOS FINALES CARGADOS DEL MES ' + this.mesSeleccionado + ' ===');
        console.log(this.vendedores);
        this.cargando = false;
      })
      .catch((err) => {
        console.error('Error cargando datos:', err);
        this.cargando = false;
      });
  }

  /**
   * Calcular métricas para cada vendedor
   */
  calcularMetricasVendedor(vendedor: any): void {
    // Asegurar que los valores numéricos sean números
    vendedor.total_ventas_mes = parseFloat(vendedor.facturacion_total || vendedor.total_ventas_mes || 0);
    vendedor.total_clientes_mes = parseInt(vendedor.total_clientes_mes || 0, 10);

    // Inicializar porcentajes
    vendedor.porcentajePonderado = 0;
    vendedor.porcentajeFacturacion = 0;
    vendedor.porcentajeGlobal = 0;

    console.log('=== MÉTRICAS DE ' + (vendedor.nombre || 'Vendedor') + ' ===');
    console.log('bonoData recibido:', vendedor.bonoData);
    console.log('bonoData type:', typeof vendedor.bonoData);
    console.log('bonoData is null?', vendedor.bonoData === null);
    console.log('bonoData is undefined?', vendedor.bonoData === undefined);
    if (vendedor.bonoData) {
      console.log('bonoData keys:', Object.keys(vendedor.bonoData));
    }

    // Calcular porcentaje ponderado de KPIs
    if (vendedor.bonoData && typeof vendedor.bonoData === 'object') {
      const prospeccion = vendedor.bonoData.prospeccion;
      const llamadas = vendedor.bonoData.llamadas;
      const rh = vendedor.bonoData.rh;
      
      console.log('ANTES DE CÁLCULO:');
      console.log('  prospeccion:', prospeccion, ' | prospeccion?.porcentaje:', prospeccion?.porcentaje);
      console.log('  llamadas:', llamadas, ' | llamadas?.porcentaje:', llamadas?.porcentaje);
      console.log('  rh:', rh, ' | rh?.porcentaje:', rh?.porcentaje);
      
      const prospeccionAporte = (prospeccion?.porcentaje || 0) * 0.60;
      const llamadasAporte = (llamadas?.porcentaje || 0) * 0.25;
      const rhAporte = (rh?.porcentaje || 0) * 0.15;
      
      console.log('APORTES CRUDOS:');
      console.log('  Prospeccion (60%):', prospeccionAporte);
      console.log('  Llamadas (25%):', llamadasAporte);
      console.log('  RH (15%):', rhAporte);
      console.log('  SUM:', prospeccionAporte + llamadasAporte + rhAporte);
      
      vendedor.porcentajePonderado = Math.round((prospeccionAporte + llamadasAporte + rhAporte) * 100) / 100;
      console.log('RESULTADO FINAL - Ponderado:', vendedor.porcentajePonderado + '%');
    } else {
      console.log('⚠️ bonoData no disponible o inválido!');
      vendedor.porcentajePonderado = 0;
    }

    // Calcular % de facturación hacia meta (Q4,000)
    if (vendedor.total_ventas_mes > 0) {
      const porcentajeReal = (vendedor.total_ventas_mes / 4000) * 100;
      vendedor.porcentajeFacturacion = Math.min(Math.round(porcentajeReal), 100);
    } else {
      vendedor.porcentajeFacturacion = 0;
    }
    
    // Calcular % global = promedio de facturación y KPIs (50% cada uno)
    vendedor.porcentajeGlobal = Math.round((vendedor.porcentajeFacturacion * 0.5) + (vendedor.porcentajePonderado * 0.5));

    console.log((vendedor.nombre || 'Vendedor') + ': Ponderado=' + vendedor.porcentajePonderado + '%, Fact=' + vendedor.porcentajeFacturacion + '%, Global=' + vendedor.porcentajeGlobal + '%');
  }

  /**
   * Cambiar mes seleccionado
   */
  cambiarMes(mes: string): void {
    this.mesSeleccionado = mes;
    this.cargarDatos();
  }

  /**
   * Obtener mes actual en texto
   */
  obtenerMesActual(): string {
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const [year, month] = this.mesSeleccionado.split('-');
    return `${nombres[parseInt(month)-1]} ${year}`;
  }

  /**
   * Generar 12 últimos meses
   */
  generarMeses(): {valor: string; etiqueta: string}[] {
    const meses = [];
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    
    // Comenzar desde hace 11 meses, hasta el mes actual
    for (let i = 11; i >= 0; i--) {
      let year = 2026;
      let month = 5 - i; // Mayo es 5
      
      // Ajustar año si el mes es negativo
      while (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      const valor = year + '-' + String(month).padStart(2, '0');
      const etiqueta = nombres[month - 1] + ' ' + year;
      meses.push({ valor, etiqueta });
    }
    
    return meses;
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

  convertirNumeros(): void {
    if (this.vendedores) {
      this.vendedores = this.vendedores.map((v: any) => ({
        ...v,
        total_ventas_mes: parseFloat(v.total_ventas_mes)
      }));
    }
  }
}
