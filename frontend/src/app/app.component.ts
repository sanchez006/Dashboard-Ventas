import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService, Usuario } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatDialogModule
  ],
  template: `
    <!-- TOOLBAR -->
    <mat-toolbar class="custom-toolbar" *ngIf="usuarioActual">
      <button class="menu-btn" (click)="toggleSidenav()" *ngIf="!isMobile">
        <span class="hamburger-icon">&#9776;</span>
      </button>
      <span class="brand-text">Ventas</span>
      <span class="toolbar-spacer"></span>
      <div class="user-avatar" [matMenuTriggerFor]="menu">
        {{ getInitials() }}
        <span class="role-dot" [class.admin]="usuarioActual.rol === 'admin'"></span>
      </div>
      <mat-menu #menu="matMenu">
        <div class="menu-user-info">
          <strong>{{ usuarioActual.nombre }}</strong>
          <span>{{ usuarioActual.rol }}</span>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <span>🚪</span>&nbsp; Cerrar sesión
        </button>
      </mat-menu>
    </mat-toolbar>

    <!-- SIDENAV (escritorio) -->
    <mat-sidenav-container *ngIf="usuarioActual" class="sidenav-container">
      <mat-sidenav #sidenav class="sidenav" [mode]="isMobile ? 'over' : 'side'" [opened]="!isMobile">
        <nav class="nav-list">
          <!-- SOLO VENDEDORES VEN ESTO -->
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/dashboard" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">🏠</span><span class="nav-label">Dashboard</span>
          </a>
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/comisiones" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">💰</span><span class="nav-label">Mis Comisiones</span>
          </a>
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/historico" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">📊</span><span class="nav-label">Últimos 5 Meses</span>
          </a>
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/clientes" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">👥</span><span class="nav-label">Clientes</span>
          </a>
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/incumplimientos" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">⚠️</span><span class="nav-label">Incumplimientos</span>
          </a>
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/clientes-grafica" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">📈</span><span class="nav-label">Clientes por Mes</span>
          </a>
          <a *ngIf="usuarioActual.rol === 'vendedor'" class="nav-item" routerLink="/bono-variable" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">🎯</span><span class="nav-label">Bono Variable</span>
          </a>

          <!-- SOLO ADMIN VE ESTO -->
          <a *ngIf="usuarioActual.rol === 'admin'" class="nav-item" routerLink="/vendedores" routerLinkActive="nav-active" (click)="onNavClick(sidenav)">
            <span class="nav-icon">👔</span><span class="nav-label">Vendedores</span>
          </a>
        </nav>
      </mat-sidenav>

      <mat-sidenav-content>
        <div [class.mobile-content]="isMobile">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <!-- MÁS MENU POPUP (móvil) -->
    <div class="mas-backdrop" *ngIf="isMobile && masAbierto" (click)="masAbierto=false"></div>
    <div class="mas-menu" *ngIf="isMobile && usuarioActual && masAbierto">
      <a class="mas-item" routerLink="/historico" routerLinkActive="mas-active" (click)="masAbierto=false">
        <span>📊</span> Últimos 5 Meses
      </a>
      <a class="mas-item" routerLink="/incumplimientos" routerLinkActive="mas-active" (click)="masAbierto=false">
        <span>⚠️</span> Incumplimientos
      </a>
      <a class="mas-item" routerLink="/clientes-grafica" routerLinkActive="mas-active" (click)="masAbierto=false">
        <span>📈</span> Clientes por Mes
      </a>
      <a *ngIf="usuarioActual.rol === 'admin'" class="mas-item" routerLink="/vendedores" routerLinkActive="mas-active" (click)="masAbierto=false">
        <span>👔</span> Vendedores
      </a>
    </div>

    <!-- BOTTOM NAV (móvil) - SOLO PARA VENDEDORES -->
    <nav class="bottom-nav" *ngIf="usuarioActual && isMobile && usuarioActual.rol === 'vendedor'">
      <a class="bnav-item" routerLink="/dashboard" routerLinkActive="bnav-active" (click)="masAbierto=false">
        <span class="bnav-icon">🏠</span><span class="bnav-label">Inicio</span>
      </a>
      <a class="bnav-item" routerLink="/comisiones" routerLinkActive="bnav-active" (click)="masAbierto=false">
        <span class="bnav-icon">💰</span><span class="bnav-label">Comisiones</span>
      </a>
      <a class="bnav-item" routerLink="/clientes" routerLinkActive="bnav-active" (click)="masAbierto=false">
        <span class="bnav-icon">👥</span><span class="bnav-label">Clientes</span>
      </a>
      <a class="bnav-item" routerLink="/bono-variable" routerLinkActive="bnav-active" (click)="masAbierto=false">
        <span class="bnav-icon">🎯</span><span class="bnav-label">Bono</span>
      </a>
      <button class="bnav-item" [class.bnav-active]="masAbierto" (click)="masAbierto=!masAbierto">
        <span class="bnav-icon">{{ masAbierto ? '✕' : '···' }}</span><span class="bnav-label">Más</span>
      </button>
    </nav>

    <!-- LOGIN -->
    <div *ngIf="!usuarioActual" class="login-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .custom-toolbar {
      background: linear-gradient(90deg, #1B6B6B 0%, #0F4A4A 100%) !important;
      color: white;
      padding: 0 12px;
      height: 52px;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .menu-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      margin-right: 6px;
      &:hover { background: rgba(255,255,255,0.1); }
    }
    .hamburger-icon { font-size: 20px; color: white; }

    .brand-text {
      font-size: 16px;
      font-weight: 700;
      color: white;
      letter-spacing: 0.5px;
    }

    .toolbar-spacer { flex: 1; }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      position: relative;
      border: 2px solid rgba(255,255,255,0.4);
      user-select: none;
      &:hover { background: rgba(255,255,255,0.3); }
      .role-dot {
        position: absolute;
        bottom: -1px; right: -1px;
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #4caf50;
        border: 2px solid #1B6B6B;
        &.admin { background: #ff9800; }
      }
    }

    .menu-user-info {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      strong { font-size: 14px; }
      span { font-size: 12px; color: #888; text-transform: capitalize; }
    }

    .sidenav-container {
      height: calc(100vh - 52px);
      background: #0a1f1f;
    }

    /* Sobreescribir fondo blanco de Material */
    ::ng-deep .mat-drawer-container { background: #0a1f1f !important; }
    ::ng-deep .mat-drawer-content   { background: #0a1f1f !important; }

    .sidenav {
      width: 230px;
      background: #0a1f1f;
      border-right: 1px solid rgba(255,255,255,0.08);
    }

    /* Sidenav custom nav */
    .nav-list {
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s;
      &:hover { background: rgba(255,255,255,0.08); color: white; }
      &.nav-active { background: rgba(255,255,255,0.15); color: white; }
    }
    .nav-icon { font-size: 18px; flex-shrink: 0; }
    .nav-label { }

    /* Bottom nav */
    .bottom-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 60px;
      background: #0a3333;
      display: flex;
      align-items: stretch;
      z-index: 200;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .bnav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: rgba(255,255,255,0.45);
      text-decoration: none;
      font-size: 10px;
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
      &.bnav-active { color: #7ecfcf; }
      &:active { opacity: 0.7; }
    }
    .bnav-icon { font-size: 20px; line-height: 1; }
    .bnav-label { font-size: 9px; letter-spacing: 0.2px; }

    /* Más popup */
    .mas-backdrop {
      position: fixed;
      inset: 0;
      z-index: 198;
      background: rgba(0,0,0,0.3);
    }
    .mas-menu {
      position: fixed;
      bottom: 64px;
      right: 0;
      left: 0;
      background: #0f3a3a;
      border-top: 1px solid rgba(255,255,255,0.15);
      z-index: 199;
      padding: 8px 0;
      animation: slideUp 0.18s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .mas-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      &:last-child { border-bottom: none; }
      &:active, &.mas-active { color: #7ecfcf; }
    }

    .mobile-content { padding-bottom: 66px; }
    .login-container { width: 100vw; height: 100vh; }
  `]
})
export class AppComponent implements OnInit {
  @ViewChild('sidenav') sidenavRef!: MatSidenav;
  title = 'pagina-ventas-frontend';
  usuarioActual: Usuario | null = null;
  isMobile = window.innerWidth < 768;
  masAbierto = false;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('AppComponent inicializado');
  }

  ngOnInit(): void {
    console.log('ngOnInit - App iniciando');
    
    // Observar cambios de usuario
    this.authService.usuario$.subscribe(usuario => {
      this.usuarioActual = usuario;
      console.log('Usuario actualizado:', usuario ? usuario.email : 'null');
    });

    // Verificar token al cargar
    const token = this.authService.getToken();
    console.log('Token al cargar:', token ? '✅' : '❌');
  }

  getInitials(): string {
    if (!this.usuarioActual?.nombre) return '?';
    const parts = this.usuarioActual.nombre.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  toggleSidenav(): void {
    this.sidenavRef.toggle();
  }

  onNavClick(sidenav: any): void {
    if (this.isMobile) sidenav.close();
  }

  logout(): void {
    console.log('Logout iniciado');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
