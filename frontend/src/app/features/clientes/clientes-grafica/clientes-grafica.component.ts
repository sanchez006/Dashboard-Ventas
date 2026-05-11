
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, ChartConfiguration, ChartType, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';

// Registrar controladores y plugin para Chart.js
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, Filler, DataLabelsPlugin);

@Component({
  selector: 'app-clientes-grafica',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts()],
  templateUrl: './clientes-grafica.component.html',
  styleUrl: './clientes-grafica.component.scss'
})
export class ClientesGraficaComponent implements OnInit {
  public DataLabelsPlugin = DataLabelsPlugin;

  public chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Clientes por Mes',
        fill: true,
        borderColor: '#d50000',
        backgroundColor: 'rgba(255,255,255,1)',
        pointBackgroundColor: '#d50000',
        pointBorderColor: '#d50000',
        pointRadius: 7,
        pointHoverRadius: 10,
        borderWidth: 4,
        tension: 0.4
      }
    ]
  };
  public chartType: ChartType = 'line';
  public chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    layout: {
      padding: { top: 28 }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      datalabels: {
        anchor: 'end',
        align: 'top',
        offset: 4,
        color: '#d50000',
        font: { weight: 'bold', size: 14 },
        formatter: (value: any) => value
      }
    },
    scales: {
      x: { grid: { color: '#eee' } },
      y: {
        grid: { color: '#eee' },
        ticks: { padding: 4 }
      }
    }
  };
  public loading = true;
  public error = '';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    const idAsesor = this.authService.getIdAsesor();
    if (!idAsesor) {
      this.error = 'No se pudo obtener el ID del asesor.';
      this.loading = false;
      return;
    }
    this.apiService.obtenerClientesPorMes(idAsesor).subscribe({
      next: (resp) => {
        this.chartData.labels = resp.data.map(item => item.mes);
        this.chartData.datasets[0].data = resp.data.map(item => item.total);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de la gráfica.';
        this.loading = false;
      }
    });
  }
}
