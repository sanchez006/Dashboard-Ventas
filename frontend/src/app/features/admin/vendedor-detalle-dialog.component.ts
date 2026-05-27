import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendedor-detalle-dialog',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatDialogModule],
  templateUrl: './vendedor-detalle-dialog.component.html',
  styleUrls: ['./vendedor-detalle-dialog.component.scss']
})
export class VendedorDetalleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VendedorDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
