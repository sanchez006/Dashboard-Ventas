import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Incumplimiento {
  id_servicio: number;
  id_asesor: number;
  nombre_cliente: string;
  fecha_instalacion: string;
  fecha_vencimiento_pago: string;
  contador_incumplimientos: number;
  precio_plan: string;
  comision_retenida: string;
  meses_sin_pagar: string[]; // Array de meses: ["Abril 2026", "Junio 2026"]
  created_at: string;
}

@Component({
  selector: 'app-incumplimientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incumplimientos.component.html',
  styleUrls: ['./incumplimientos.component.scss']
})
export class IncumplimientosComponent implements OnInit, OnDestroy {
  incumplimientos: Incumplimiento[] = [];
  cargando = true;
  mostrarTabla = false;
  totalIncumplimientos = 0;
  sumaPenalizaciones = 0;
  sumaPreciosPlan = 0;
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = [
    'nombre_cliente',
    'contador_incumplimientos',
    'precio_plan',
    'comision_retenida',
    'fecha_vencimiento_pago'
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarIncumplimientos();
    // Auto-refresh cada 10 minutos
    setInterval(() => {
      this.cargarIncumplimientos();
    }, 600000);
  }

  cargarIncumplimientos(): void {
    this.apiService.obtenerIncumplimientos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any) => {
          if (respuesta.success && Array.isArray(respuesta.data)) {
            this.incumplimientos = respuesta.data;
            this.totalIncumplimientos = respuesta.data.length;
            this.mostrarTabla = this.totalIncumplimientos > 0;

            // Calcular sumas
            this.sumaPenalizaciones = this.incumplimientos.reduce((sum, inc) => {
              return sum + (parseFloat(inc.comision_retenida) || 0);
            }, 0);

            this.sumaPreciosPlan = this.incumplimientos.reduce((sum, inc) => {
              return sum + (parseFloat(inc.precio_plan) || 0);
            }, 0);
          }
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar incumplimientos:', err);
          this.cargando = false;
        }
      });
  }

  formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  // Método para usar parseFloat en el template
  parseFloat(value: string): number {
    return parseFloat(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
