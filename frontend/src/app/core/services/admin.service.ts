import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl + '/admin';

  constructor(private http: HttpClient) {}

  /**
   * Obtener resumen general de todos los vendedores
   */
  obtenerResumenGlobal(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-resumen`);
  }

  /**
   * Obtener todos los vendedores con sus detalles
   */
  obtenerVendedoresDetalle(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vendedores-detalle`);
  }

  /**
   * Obtener ranking de vendedores
   */
  obtenerRankingVendedores(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ranking-vendedores`);
  }

  /**
   * Obtener comisiones de todos los vendedores en un mes
   */
  obtenerComisionesMes(mes: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comisiones-mes/${mes}`);
  }

  /**
   * Obtener resumen agregado de un mes específico
   */
  obtenerResumenMes(mes: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen-mes/${mes}`);
  }

  /**
   * Obtener todos los clientes de todos los vendedores
   */
  obtenerTodosClientes(limit: number = 100, offset: number = 0, mes?: string): Observable<any> {
    let url = `${this.apiUrl}/todos-clientes?limit=${limit}&offset=${offset}`;
    if (mes) {
      url += `&mes=${mes}`;
    }
    return this.http.get<any>(url);
  }

  /**
   * Obtener clientes de un vendedor específico en un mes
   */
  obtenerClientesVendedor(vendedorId: number, mes: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vendedor/${vendedorId}/clientes/${mes}`);
  }

  /**
   * Calcular comisiones de un vendedor en un mes específico (EN TIEMPO REAL)
   */
  calcularComisionesVendedor(vendedorId: number, nombreVendedor: string, mes: string): Observable<any> {
    const fechaMes = new Date(`${mes}-01T00:00:00Z`);
    return this.http.post<any>(`${environment.apiUrl}/comisiones/calcular`, {
      idAsesor: vendedorId,
      nombreAsesor: nombreVendedor,
      mes: fechaMes.toISOString()
    });
  }

  /**
   * Obtener comisiones de un vendedor específico en un mes
   */
  obtenerComisionesVendedor(vendedorId: number, mes: string): Observable<any> {
    // Usar el endpoint de comisiones que SÍ existe
    return this.http.get<any>(`${environment.apiUrl}/comisiones?idAsesor=${vendedorId}&mes=${mes}-01`);
  }
}
