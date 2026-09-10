/** Modelo de datos. Ver docs/ESPECIFICACION.md §6 */

export type EstadoBloque = 'pendiente' | 'en_curso' | 'hecho' | 'movido' | 'saltado';
export type Energia = 'baja' | 'media' | 'alta';
export type Tramo = 5 | 10 | 15 | 30;

export interface Bloque {
  id: string;
  /** ISO corto: YYYY-MM-DD */
  fecha: string;
  /** minutos desde medianoche, siempre múltiplo del tramo mínimo (5) */
  inicioMin: number;
  duracionMin: number;
  titulo: string;
  /** id de plantilla o tipo libre */
  tipo: string;
  color: string;
  energia: Energia;
  estado: EstadoBloque;
  nota?: string;
  actualizado: number;
}

export interface Plantilla {
  id: string;
  nombre: string;
  color: string;
  duracionMin: number;
  energia: Energia;
  /** de fábrica: editable pero se restaura si se borra todo */
  fabrica?: boolean;
}

export interface Ajustes {
  /** granularidad de la rejilla y del snap */
  tramoMin: Tramo;
  diaInicioMin: number;
  diaFinMin: number;
  calma: boolean;
}

export const AJUSTES_DEFECTO: Ajustes = {
  tramoMin: 15,
  diaInicioMin: 6 * 60,
  diaFinMin: 24 * 60,
  calma: false
};

/** Escala de la rejilla: píxeles por minuto según el tramo (zoom temporal). */
export const PX_POR_MIN: Record<Tramo, number> = {
  5: 2.4,
  10: 1.8,
  15: 1.4,
  30: 1
};

export const MIN_BLOQUE = 5;
