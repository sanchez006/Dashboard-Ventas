import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KPI, DashboardKPIs } from '../../models/kpi.model';
import { Cliente, ClienteDetalle } from '../../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

    obtenerClientesPorMes(idAsesor: number): Observable<{ success: boolean; data: { mes: string; total: number }[] }> {
      return this.http.get<{ success: boolean; data: { mes: string; total: number }[] }>(`${this.apiUrl}/clientes/por-mes/${idAsesor}`);
    }

  // Bono Variable
  getBonoTotal(idAsesor: number, mes?: string): Observable<any> {
    const params = mes ? `?mes=${mes}` : '';
    return this.http.get<any>(`${this.apiUrl}/bono/total/${idAsesor}${params}`);
  }

  getPorcentajeProspeccion(idAsesor: number, mes?: string): Observable<any> {
    const params = mes ? `?mes=${mes}` : '';
    return this.http.get<any>(`${this.apiUrl}/bono/prospectos/porcentaje/${idAsesor}${params}`);
  }

  getProspectos(idAsesor: number, mes?: string): Observable<any> {
    const params = mes ? `?mes=${mes}` : '';
    return this.http.get<any>(`${this.apiUrl}/bono/prospectos/${idAsesor}${params}`);
  }

  importarProspectos(idAsesor: number, nombreAsesor: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('id_asesor', idAsesor.toString());
    formData.append('nombre_asesor', nombreAsesor);
    return this.http.post<any>(`${this.apiUrl}/bono/prospectos/importar`, formData);
  }

  getPorcentajeLlamadas(idAsesor: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bono/llamadas/porcentaje/${idAsesor}`);
  }

  getLlamadas(idAsesor: number, mes?: string): Observable<any> {
    const params = mes ? `?mes=${mes}` : '';
    return this.http.get<any>(`${this.apiUrl}/bono/llamadas/lista/${idAsesor}${params}`);
  }

  importarLlamadas(idAsesor: number, nombreAsesor: string, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('id_asesor', idAsesor.toString());
    formData.append('nombre_asesor', nombreAsesor);
    return this.http.post<any>(`${this.apiUrl}/bono/llamadas/importar`, formData);
  }

  sincronizarDesdeSheets(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bono/sincronizar/sheets`, {});
  }
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // KPIs
  obtenerKPIs(): Observable<{ success: boolean; data: DashboardKPIs }> {
    return this.http.get<{ success: boolean; data: DashboardKPIs }>(
      `${this.apiUrl}/kpis`
    );
  }

  obtenerKPI(id: string): Observable<{ success: boolean; data: KPI }> {
    return this.http.get<{ success: boolean; data: KPI }>(
      `${this.apiUrl}/kpis/${id}`
    );
  }

  // Clientes
  obtenerClientes(limit: number = 100, offset: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    
    return this.http.get<any>(`${this.apiUrl}/clientes`, { params });
  }

  obtenerClientePorId(id: number): Observable<{ success: boolean; data: ClienteDetalle }> {
    return this.http.get<{ success: boolean; data: ClienteDetalle }>(
      `${this.apiUrl}/clientes/${id}`
    );
  }

  obtenerClientesPorEstado(estado: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes/estado/${estado}`);
  }

  obtenerProximosVencimientos(dias: number = 30): Observable<any> {
    const params = new HttpParams().set('dias', dias);
    return this.http.get<any>(`${this.apiUrl}/clientes/alertas/vencimientos`, { params });
  }

  obtenerResumenClientes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes/resumen/por-estado`);
  }

  // Comisiones - Incumplimientos
  obtenerIncumplimientos(idAsesor?: number): Observable<any> {
    let url = `${this.apiUrl}/comisiones/incumplimientos/lista`;
    if (idAsesor) url += `?idAsesor=${idAsesor}`;
    return this.http.get<any>(url);
  }

  // Health check
  verificarConexion(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl.replace('/api', '')}/api/health`);
  }
}
