import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-vendedores',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div style="padding: 20px;">
      <h1>🏆 Ranking de Vendedores</h1>
      <mat-card style="margin-top: 20px;">
        <mat-card-content>
          Ranking con gráficas, estadísticas y gamificación...
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class VendedoresComponent {}
