import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale, Title, PieController } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

Chart.register(ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale, Title, PieController, DataLabelsPlugin);

@Component({
  selector: 'app-bono-variable',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  providers: [provideCharts()],
  templateUrl: './bono-variable.component.html',
  styleUrl: './bono-variable.component.scss'
})
export class BonoVariableComponent implements OnInit {
  public DataLabelsPlugin = DataLabelsPlugin;
  loading = true;
  error = '';
  mostrarTablaProspectos = false;
  idAsesor: number | null = null;
  nombreAsesor = '';

  bono: any = null;

  // Pie chart prospección
  pieProspeccion: ChartConfiguration<'pie'>['data'] = {
    labels: ['Completado', 'Pendiente'],
    datasets: [{ data: [0, 100], backgroundColor: ['#d50000', '#f5f5f5'], borderWidth: 0 }]
  };
  pieProspeccionOpts: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: { legend: { display: true }, datalabels: { formatter: (v: any) => v + '%', color: '#333', font: { size: 14, weight: 'bold' } } }
  };

  // Pie chart llamadas
  pieLlamadas: ChartConfiguration<'pie'>['data'] = {
    labels: ['Completado', 'Pendiente'],
    datasets: [{ data: [0, 100], backgroundColor: ['#1976d2', '#f5f5f5'], borderWidth: 0 }]
  };
  pieLlamadasOpts: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: { legend: { display: true }, datalabels: { formatter: (v: any) => v + '%', color: '#333', font: { size: 14, weight: 'bold' } } }
  };

  // Pie chart bono total
  pieTotal: ChartConfiguration<'pie'>['data'] = {
    labels: ['Prospección (60%)', 'Llamadas (25%)', 'RH y Otros (15%)'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#d50000', '#1976d2', '#388e3c'], borderWidth: 2 }]
  };
  pieTotalOpts: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: { legend: { display: true, position: 'bottom' }, datalabels: { display: false } }
  };

  // Bar chart ventas por mes
  barVentas: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Ventas por Mes', backgroundColor: '#d50000', borderRadius: 6 }]
  };
  barVentasOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    layout: { padding: { top: 24 } },
    plugins: {
      legend: { display: false },
      datalabels: { anchor: 'end', align: 'top', offset: 4, color: '#d50000', font: { weight: 'bold', size: 13 }, formatter: (v: any) => v }
    },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#eee' } } }
  };

  prospectos: any[] = [];
  llamadasList: any[] = [];
  mostrarTablaLlamadas = false;
  mostrarTablaRH = false;
  subiendoProspectos = false;
  subiendoLlamadas = false;
  mensajeImport = '';
  sincronizando = false;
  mensajeSync = '';
  mesSeleccionado: string = new Date().toISOString().slice(0, 7);
  mesesDisponibles: { valor: string; etiqueta: string }[] = [];

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    this.idAsesor = this.authService.getIdAsesor();
    this.nombreAsesor = usuario?.nombre || '';

    if (!this.idAsesor) {
      this.error = 'No se pudo obtener el ID del asesor.';
      this.loading = false;
      return;
    }
    this.generarMesesDisponibles();
    this.cargarDatos();
  }

  generarMesesDisponibles(): void {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const valor = d.toISOString().slice(0, 7);
      const etiqueta = `${meses[d.getMonth()]} ${d.getFullYear()}`;
      this.mesesDisponibles.push({ valor, etiqueta });
    }
    this.mesSeleccionado = hoy.toISOString().slice(0, 7);
  }

  cambiarMes(mes: string): void {
    this.mesSeleccionado = mes;
    this.prospectos = [];
    this.llamadasList = [];
    this.mostrarTablaLlamadas = false;
    this.mostrarTablaRH = false;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.apiService.getBonoTotal(this.idAsesor!, this.mesSeleccionado).subscribe({
      next: (resp) => {
        this.bono = resp.data;
        // Actualizar pie prospección
        this.pieProspeccion = {
          labels: ['Completado', 'Pendiente'],
          datasets: [{ data: [this.bono.prospeccion.porcentaje, 100 - this.bono.prospeccion.porcentaje], backgroundColor: ['#d50000', '#f5f5f5'], borderWidth: 0 }]
        };
        // Actualizar pie llamadas
        this.pieLlamadas = {
          labels: ['Completado', 'Pendiente'],
          datasets: [{ data: [this.bono.llamadas.porcentaje, 100 - this.bono.llamadas.porcentaje], backgroundColor: ['#1976d2', '#f5f5f5'], borderWidth: 0 }]
        };
        // Actualizar pie total
        this.pieTotal = {
          labels: ['Prospección (60%)', 'Llamadas (25%)', 'RH y Otros (15%)'],
          datasets: [{ data: [this.bono.prospeccion.ganado, this.bono.llamadas.ganado, this.bono.rh.ganado], backgroundColor: ['#d50000', '#1976d2', '#388e3c'], borderWidth: 2 }]
        };
        this.loading = false;
      },
      error: () => { this.error = 'Error al cargar el bono.'; this.loading = false; }
    });

    // Bar chart ventas por mes
    this.apiService.obtenerClientesPorMes(this.idAsesor!).subscribe({
      next: (resp) => {
        this.barVentas = {
          labels: resp.data.map((d: any) => d.mes),
          datasets: [{ data: resp.data.map((d: any) => d.total), label: 'Ventas por Mes', backgroundColor: '#d50000', borderRadius: 6 }]
        };
      }
    });
  }

  verProspectos(): void {
    this.mostrarTablaProspectos = !this.mostrarTablaProspectos;
    if (this.mostrarTablaProspectos && this.prospectos.length === 0) {
      this.apiService.getProspectos(this.idAsesor!, this.mesSeleccionado).subscribe({
        next: (resp: any) => { this.prospectos = resp.data || []; }
      });
    }
  }

  getMesNombre(mes: string): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const [year, month] = mes.split('-');
    return `${meses[parseInt(month) - 1]} ${year}`;
  }

  getRingOffset(porcentaje: number): number {
    const circumference = 264;
    return circumference * (1 - Math.min(porcentaje, 100) / 100);
  }

  verLlamadas(): void {
    this.mostrarTablaLlamadas = !this.mostrarTablaLlamadas;
    if (this.mostrarTablaLlamadas && this.llamadasList.length === 0) {
      this.apiService.getLlamadas(this.idAsesor!, this.mesSeleccionado).subscribe({
        next: (resp: any) => { this.llamadasList = resp.data || []; }
      });
    }
  }

  verRH(): void {
    this.mostrarTablaRH = !this.mostrarTablaRH;
  }

  onArchivoProspectos(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo || !this.idAsesor) return;
    this.subiendoProspectos = true;
    this.mensajeImport = '';
    this.apiService.importarProspectos(this.idAsesor, this.nombreAsesor, archivo).subscribe({
      next: (resp) => {
        this.mensajeImport = `✅ Prospectos importados: ${resp.importados}`;
        this.subiendoProspectos = false;
        this.prospectos = [];
        this.cargarDatos();
      },
      error: () => { this.mensajeImport = '❌ Error al importar prospectos.'; this.subiendoProspectos = false; }
    });
  }

  onArchivoLlamadas(event: any): void {
    const archivo = event.target.files[0];
    if (!archivo || !this.idAsesor) return;
    this.subiendoLlamadas = true;
    this.mensajeImport = '';
    this.apiService.importarLlamadas(this.idAsesor, this.nombreAsesor, archivo).subscribe({
      next: (resp) => {
        this.mensajeImport = `✅ Llamadas importadas: ${resp.importados}`;
        this.subiendoLlamadas = false;
        this.cargarDatos();
      },
      error: () => { this.mensajeImport = '❌ Error al importar llamadas.'; this.subiendoLlamadas = false; }
    });
  }

  sincronizar(): void {
    this.sincronizando = true;
    this.mensajeSync = '⏳ Sincronizando desde Google Sheets...';
    this.apiService.sincronizarDesdeSheets().subscribe({
      next: (resp) => {
        this.mensajeSync = `✅ ${resp.message || 'Sincronización iniciada en background'}`;
        this.sincronizando = false;
        // Recargar datos después de 2 segundos para que complete la sincronización
        setTimeout(() => {
          this.prospectos = [];
          this.cargarDatos();
        }, 2000);
      },
      error: () => {
        this.mensajeSync = '❌ Error al sincronizar.';
        this.sincronizando = false;
      }
    });
  }
}
