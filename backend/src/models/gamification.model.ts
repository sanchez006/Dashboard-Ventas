export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icon: string;
  puntos: number;
  nivel: 'bronce' | 'plata' | 'oro' | 'platino';
  desbloqueado: boolean;
  fechaDesbloqueado?: Date;
}

export interface Mascota {
  id: string;
  nombre: string;
  nivel: number;
  experiencia: number;
  experienciaProxNivel: number;
  estado: 'feliz' | 'normal' | 'triste' | 'celebrando';
  logros: Logro[];
  racha_actual: number;
}

export interface GamificationStats {
  puntos_totales: number;
  logros_desbloqueados: number;
  racha_dias: number;
  mascota: Mascota;
  proxima_recompensa: string;
}
