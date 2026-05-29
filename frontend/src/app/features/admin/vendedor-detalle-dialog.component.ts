import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vendedor-detalle-dialog',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatDialogModule],
  templateUrl: './vendedor-detalle-dialog.component.html',
  styleUrls: ['./vendedor-detalle-dialog.component.scss']
})
export class VendedorDetalleDialogComponent {
  mesLlamadas: string;
  mesProspectos: string;
  mesIncumplimientos: string;
  llamadas: any[] = [];
  prospectos: any[] = [];
  incumplimientos: any[] = [];
  metaLlamadas: number = 20;
  apiUrl = environment.apiUrl;

  constructor(
    public dialogRef: MatDialogRef<VendedorDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private http: HttpClient
  ) {
    const mesActual = new Date().toISOString().slice(0, 7);
    this.mesLlamadas = mesActual;
    this.mesProspectos = mesActual;
    this.mesIncumplimientos = mesActual;
    this.llamadas = data.llamadas || [];
    this.prospectos = data.prospectos || [];
    this.incumplimientos = data.incumplimientos || [];
    this.cargarMetaLlamadas();
  }

  cargarMetaLlamadas() {
    const idAsesor = this.data.vendedor?.id_asesor;
    const mes = this.mesLlamadas;
    this.http.get<any>(`${this.apiUrl}/comisiones/admin/${idAsesor}/${mes}`).subscribe({
      next: (resp) => {
        let comision = Array.isArray(resp?.data) ? resp.data[0] : resp.data;
        this.metaLlamadas = comision?.cantidad_clientes || 20;
      },
      error: () => { this.metaLlamadas = 20; }
    });
  }

  async onMesLlamadasChange(event: any) {
    const mes = event.target.value;
    this.mesLlamadas = mes;
    const idAsesor = this.data.vendedor?.id_asesor;
    this.llamadas = await this.apiService.getLlamadas(idAsesor, mes).toPromise().then((r: any) => r?.data || []);
    this.cargarMetaLlamadas();
  }

  async onMesProspectosChange(event: any) {
    const mes = event.target.value;
    this.mesProspectos = mes;
    const idAsesor = this.data.vendedor?.id_asesor;
    this.prospectos = await this.apiService.getProspectos(idAsesor, mes).toPromise().then((r: any) => r?.data || []);
  }

  async onMesIncumplimientosChange(event: any) {
    const mes = event.target.value;
    this.mesIncumplimientos = mes;
    const idAsesor = this.data.vendedor?.id_asesor;
    this.incumplimientos = await this.apiService.obtenerIncumplimientos(idAsesor).toPromise().then((r: any) => r?.data || []);
  }

  get porcentajeLlamadas(): number {
    const meta = this.metaLlamadas || 20;
    return meta > 0 ? Math.min(Math.round((this.llamadas.length / meta) * 100), 100) : 0;
  }

  get porcentajeProspectos(): number {
    const meta = 100;
    return Math.min(Math.round((this.prospectos.length / meta) * 100), 100);
  }
}
