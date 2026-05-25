import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComisionesService } from '../../core/services/comisiones.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ProgressCircleComponent } from '../../shared/components/progress-circle/progress-circle.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-comisiones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ProgressCircleComponent
  ],
  templateUrl: './comisiones.component.html',
  styleUrls: ['./comisiones.component.scss']
})
export class ComisionesComponent implements OnInit, OnDestroy {
  usuarioActual: any;
  comisionMes: any;
  cargando = true;
  error: string | null = null;
  
  // Selector de mes
  mesSeleccionado: string = new Date().toISOString().slice(0, 7);
  mesesDisponibles: { valor: string; etiqueta: string }[] = [];

  // Auto-refresh
  autoRefreshSubscription: Subscription | null = null;
  ultimaActualizacion: Date | null = null;
  actualizando = false;
  
  // Control de confeti
  yaMostroConfeti = false;

  // KPIs Ponderados
  bonoData: any = null;
  porcentajePonderado = 0;
  porcentajeFacturacion = 0;
  porcentajeGlobal = 0;

  constructor(
    private comisionesService: ComisionesService,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('💰 Componente Comisiones inicializando...');
    this.usuarioActual = this.authService.getUsuario();
    this.generarMesesDisponibles();
    this.cargarDatos();
    this.iniciarAutoRefresh();
  }

  ngOnDestroy(): void {
    // Limpiar auto-refresh al destruir componente
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  /**
   * Generar lista de meses disponibles (6 meses)
   */
  generarMesesDisponibles(): void {
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const valor = d.toISOString().slice(0, 7);
      const etiqueta = `${nombres[d.getMonth()]} ${d.getFullYear()}`;
      this.mesesDisponibles.push({ valor, etiqueta });
    }
    this.mesSeleccionado = hoy.toISOString().slice(0, 7);
  }

  cambiarMes(mes: string): void {
    this.mesSeleccionado = mes;
    this.yaMostroConfeti = false;
    this.recalcularYCargar();
  }

  /**
   * Recalcular comisiones del mes seleccionado y luego cargar datos
   */
  recalcularYCargar(): void {
    this.cargando = true;
    this.error = null;

    console.log('Recalculando comisiones para ' + this.mesSeleccionado + '...');

    // Primero recalcular el mes seleccionado
    this.comisionesService.recalcularMes(this.mesSeleccionado).toPromise()
      .then((response) => {
        console.log('✅ Comisiones recalculadas:', response);
        // Ahora cargar comisiones Y bono en paralelo
        return Promise.all([
          this.comisionesService.obtenerMisComisiones(this.mesSeleccionado).toPromise(),
          this.apiService.getBonoTotal(this.authService.getIdAsesor()!, this.mesSeleccionado).toPromise()
        ]);
      })
      .then(([comisiones, bono]) => {
        console.log('✅ Comisiones actualizadas:', comisiones);
        console.log('Bono actualizado:', bono);
        
        this.comisionMes = comisiones?.data?.[0] || null;
        this.bonoData = bono?.data;
        
        if (this.bonoData) {
          this.calcularPorcentajePonderado();
        }
        
        if (this.comisionMes) {
          this.comisionMes.facturacion_total = parseFloat(this.comisionMes.facturacion_total);
          this.comisionMes.monto_total_comisiones = parseFloat(this.comisionMes.monto_total_comisiones);
          this.comisionMes.monto_bono = parseFloat(this.comisionMes.monto_bono);
          this.comisionMes.monto_penalizacion = parseFloat(this.comisionMes.monto_penalizacion);
          this.comisionMes.monto_total_neto = parseFloat(this.comisionMes.monto_total_neto);

          // Calcular % de facturación hacia meta (Q4,000)
          const porcentajeReal = (this.comisionMes.facturacion_total / 4000) * 100;
          this.porcentajeFacturacion = Math.min(Math.round(porcentajeReal), 100);
          
          // Calcular % global = promedio de facturación y KPIs (50% cada uno)
          this.porcentajeGlobal = Math.round((this.porcentajeFacturacion * 0.5) + (this.porcentajePonderado * 0.5));
          
          console.log(`📊 Facturación: ${this.porcentajeFacturacion}%, KPIs: ${this.porcentajePonderado}%, Global: ${this.porcentajeGlobal}%`);
          
          // Verificar meta después de actualizar
          if (porcentajeReal >= 100 && !this.yaMostroConfeti) {
            console.log('🎉 ¡100% de meta alcanzado en recalculo!');
            this.dispararConfeti();
            this.yaMostroConfeti = true;
          }
        }
        
        this.ultimaActualizacion = new Date();
        this.cargando = false;
      })
      .catch((error) => {
        console.error('❌ Error al recalcular:', error);
        this.error = 'Error al recalcular comisiones. Intenta de nuevo.';
        this.cargando = false;
      });
  }

  /**
   * Iniciar auto-refresh cada 10 minutos
   */
  iniciarAutoRefresh(): void {
    // 10 minutos = 600000 ms
    this.autoRefreshSubscription = interval(600000).subscribe(() => {
      console.log('Auto-refresh: Actualizando comisiones...');
      this.actualizarDatos();
    });
  }

  /**
   * Actualizar datos manualmente
   */
  actualizarDatos(): void {
    this.actualizando = true;
    this.cargando = true;
    this.error = null;

    console.log('Recalculando comisiones...');

    // Primero recalcular comisiones, luego cargar datos
    this.comisionesService.recalcularAbril2026().toPromise()
      .then((response) => {
        console.log('✅ Comisiones recalculadas:', response);
        // Ahora cargar los datos actualizados
        return this.comisionesService.obtenerMisComisiones(this.mesSeleccionado).toPromise();
      })
      .then((comisiones) => {
        console.log('✅ Comisiones actualizadas:', comisiones);
        this.comisionMes = comisiones?.data?.[0] || null;
        
        // Convertir números de strings a números
        if (this.comisionMes) {
          this.comisionMes.facturacion_total = parseFloat(this.comisionMes.facturacion_total);
          this.comisionMes.monto_total_comisiones = parseFloat(this.comisionMes.monto_total_comisiones);
          this.comisionMes.monto_bono = parseFloat(this.comisionMes.monto_bono);
          this.comisionMes.monto_penalizacion = parseFloat(this.comisionMes.monto_penalizacion);
          this.comisionMes.monto_total_neto = parseFloat(this.comisionMes.monto_total_neto);
          
          // Verificar meta después de actualizar
          const porcentajeReal = (this.comisionMes.facturacion_total / 4000) * 100;
          if (porcentajeReal >= 100 && !this.yaMostroConfeti) {
            console.log(' ¡100% de meta alcanzado en actualización!');
            this.dispararConfeti();
            this.yaMostroConfeti = true;
          }
        }
        
        this.cargando = false;
        this.actualizando = false;
        this.ultimaActualizacion = new Date();
      })
      .catch((error) => {
        console.error('❌ Error al actualizar:', error);
        this.error = 'Error al actualizar comisiones. Intenta de nuevo.';
        this.cargando = false;
        this.actualizando = false;
      });
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    console.log('Cargando comisiones del mes...');

    // Cargar comisiones Y bono total en paralelo
    Promise.all([
      this.comisionesService.obtenerMisComisiones(this.mesSeleccionado).toPromise(),
      this.apiService.getBonoTotal(this.authService.getIdAsesor()!, this.mesSeleccionado).toPromise()
    ])
      .then(([comisiones, bono]) => {
        console.log('Comisiones cargadas:', comisiones);
        console.log('Bono cargado:', bono);

        // Obtener la comisión del mes actual (primer elemento)
        this.comisionMes = comisiones?.data?.[0] || null;
        
        // Guardar bono y calcular ponderado
        this.bonoData = bono?.data;
        if (this.bonoData) {
          this.calcularPorcentajePonderado();
        }
        
        if (this.comisionMes) {
          this.comisionMes.facturacion_total = parseFloat(this.comisionMes.facturacion_total);
          this.comisionMes.monto_total_comisiones = parseFloat(this.comisionMes.monto_total_comisiones);
          this.comisionMes.monto_bono = parseFloat(this.comisionMes.monto_bono);
          this.comisionMes.monto_penalizacion = parseFloat(this.comisionMes.monto_penalizacion);
          this.comisionMes.monto_total_neto = parseFloat(this.comisionMes.monto_total_neto);

          // Calcular % de facturación hacia meta (Q4,000)
          const porcentajeReal = (this.comisionMes.facturacion_total / 4000) * 100;
          this.porcentajeFacturacion = Math.min(Math.round(porcentajeReal), 100);
          
          // Calcular % global = promedio de facturación y KPIs (50% cada uno)
          this.porcentajeGlobal = Math.round((this.porcentajeFacturacion * 0.5) + (this.porcentajePonderado * 0.5));
          
          console.log(`📊 Facturación: ${this.porcentajeFacturacion}%, KPIs: ${this.porcentajePonderado}%, Global: ${this.porcentajeGlobal}%`);

          // Verificar si alcanzó el 100% de meta (Q4,000)
          if (porcentajeReal >= 100 && !this.yaMostroConfeti) {
            console.log('🎉 ¡100% de meta alcanzado! Disparando confeti...');
            this.dispararConfeti();
            this.yaMostroConfeti = true;
          } else if (porcentajeReal < 100) {
            console.log('⏳ Aún no alcanza 100% de meta');
          } else if (this.yaMostroConfeti) {
            console.log('Confeti ya fue mostrado en esta sesión');
          }
        }

        this.ultimaActualizacion = new Date();
        this.cargando = false;
      })
      .catch((err) => {
        console.error('❌ Error cargando comisiones:', err);
        this.error = 'Error al cargar las comisiones';
        this.cargando = false;
      });
  }

  /**
   * Calcular porcentaje ponderado de KPIs
   * Fórmula: (Prospección% × 0.60) + (Llamadas% × 0.25) + (RH% × 0.15)
   */
  calcularPorcentajePonderado(): void {
    if (!this.bonoData) return;
    
    const prospeccionAporte = (this.bonoData.prospeccion?.porcentaje || 0) * 0.60;
    const llamadasAporte = (this.bonoData.llamadas?.porcentaje || 0) * 0.25;
    const rhAporte = (this.bonoData.rh?.porcentaje || 0) * 0.15;
    
    this.porcentajePonderado = Math.round((prospeccionAporte + llamadasAporte + rhAporte) * 100) / 100;
    
    console.log('Ponderado: ' + this.porcentajePonderado + '%');
    console.log('- Prospeccion (60%): ' + prospeccionAporte.toFixed(2) + '%');
    console.log('- Llamadas (25%): ' + llamadasAporte.toFixed(2) + '%');
    console.log('- RH (15%): ' + rhAporte.toFixed(2) + '%');
  }

  /**
   * Disparar confeti de celebración
   */
  dispararConfeti(): void {
    console.log('Iniciando dispararConfeti...');
    
    if ((window as any).confetti) {
      console.log('canvas-confetti cargada, usando...');
      this.crearExplosionesConCanvasConfetti();
      return;
    }

    // Cargar desde CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.0/dist/confetti.browser.umd.production.min.js';
    script.type = 'text/javascript';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('canvas-confetti cargado exitosamente');
      this.crearExplosionesConCanvasConfetti();
    };
    
    script.onerror = () => {
      console.warn('No se pudo cargar canvas-confetti, usando fallback CSS');
      this.crearExplosionesCSS();
    };
    
    script.onabort = () => {
      console.warn('Carga de canvas-confetti abortada, usando fallback CSS');
      this.crearExplosionesCSS();
    };
    
    document.head.appendChild(script);
  }

  private crearExplosionesConCanvasConfetti(): void {
    const confetti = (window as any).confetti;
    if (!confetti) {
      this.crearExplosionesCSS();
      return;
    }

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random();
        const y = Math.random() * 0.7;
        
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { x, y },
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
          startVelocity: 35,
          decay: 0.95,
          gravity: 0.8,
          drift: 0,
          flat: false
        });
      }, i * 250);
    }
  }

  private crearExplosionesCSS(): void {
    console.log('Creando explosiones de confeti con CSS fallback...');
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        console.log('Explosion ' + (i + 1) + '/5');
        this.crearExplosion();
      }, i * 350);
    }
  }

  private crearExplosion(): void {
    const x = Math.random() * 100;
    const y = Math.random() * 50;
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 7 + 3;
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const velocity = 5 + Math.random() * 8;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      const duration = 1.8 + Math.random() * 0.8;
      
      particle.style.position = 'fixed';
      particle.style.left = x + '%';
      particle.style.top = y + '%';
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      particle.style.willChange = 'transform, opacity';
      
      const translateX = vx * 100;
      const translateY = vy * 100 + 150;
      
      particle.style.animation = 'confetti-burst ' + duration + 's cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
      particle.style.setProperty('--tx', translateX + 'px');
      particle.style.setProperty('--ty', translateY + 'px');
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), duration * 1000);
    }
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
   * Obtener mes actual
   */
  obtenerMesActual(): string {
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const [year, month] = this.mesSeleccionado.split('-');
    return `${nombres[parseInt(month)-1]} ${year}`;
  }

  /**
   * Navegar al dashboard
   */
  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Obtener texto de última actualización
   */
  obtenerUltimaActualizacion(): string {
    if (!this.ultimaActualizacion) {
      return 'Cargando...';
    }
    
    const ahora = new Date();
    const diff = ahora.getTime() - this.ultimaActualizacion.getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos === 0) {
      return 'Justo ahora';
    } else if (minutos === 1) {
      return 'Hace 1 minuto';
    } else if (minutos < 60) {
      return `Hace ${minutos} minutos`;
    } else {
      const horas = Math.floor(minutos / 60);
      return `Hace ${horas}h`;
    }
  }
}
