
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComisionesService {
  private apiUrl = environment.apiUrl + '/comisiones';

  constructor(private http: HttpClient) {}

  /**
   * Obtener mis comisiones (del vendedor logueado)
   */
  obtenerMisComisiones(mes?: string): Observable<any> {
    let url = `${this.apiUrl}/mis-comisiones/todas`;
    if (mes) {
      url += `?mes=${mes}`;
    }
    return this.http.get<any>(url);
  }

  /**
   * Obtener mis clientes (del vendedor logueado)
   */
  obtenerMisClientes(mes?: string): Observable<any> {
    let url = `${this.apiUrl}/mis-clientes/lista`;
    if (mes) url += `?mes=${mes}`;
    return this.http.get<any>(url);
  }

  /**
   * Obtener mis clientes históricos (últimos 5 meses sin mes actual)
   */
  obtenerClientesHistorico(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mis-clientes/historico`);
  }

  /**
   * Obtener mi resumen de 5 meses
   */
  obtenerMiResumen5Meses(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mi-resumen/5-meses`);
  }

  /**
   * Calcular comisiones (admin)
   */
  calcularComisiones(idAsesor: number, nombreAsesor: string, mes: Date): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calcular`, {
      idAsesor,
      nombreAsesor,
      mes: mes.toISOString().split('T')[0]
    });
  }

  /**
   * Calcular comisiones para todos (admin)
   */
  calcularComisionesMes(mes: Date): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calcular-mes`, {
      mes: mes.toISOString().split('T')[0]
    });
  }

  /**
   * Recalcular comisiones del mes actual
   */
  recalcularAbril2026(): Observable<any> {
    const ahora = new Date();
    const mes = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}`;
    return this.http.post<any>(`${this.apiUrl}/admin/recalcular/${mes}`, {});
  }

  /**
   * Recalcular comisiones de un mes específico (YYYY-MM)
   */
  recalcularMes(mes: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/recalcular/${mes}`, {});
  }
}
