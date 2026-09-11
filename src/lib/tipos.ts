/** Modelo de datos. Ver docs/ESPECIFICACION.md §6 */

export type EstadoBloque = 'pendiente' | 'en_curso' | 'hecho' | 'movido' | 'saltado';
export type Energia = 'baja' | 'media' | 'alta';
export type Tramo = 5 | 10 | 15 | 30;
export type Forma =
  | 'circulo'
  | 'cuadrado'
  | 'triangulo'
  | 'rombo'
  | 'hexagono'
  | 'estrella'
  | 'gota'
  | 'anillo'
  | 'barra';

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
  /** objetivo anual del que hereda el color; el año se ve en el minuto */
  objetivoId?: string;
  /** evento de hora fija: no se arrastra, se edita a mano */
  fijo?: boolean;
  /** forma de la marca; se hereda del objetivo si el bloque cuelga de uno */
  forma?: Forma;
  actualizado: number;
}

export interface Objetivo {
  id: string;
  anio: number;
  titulo: string;
  color: string;
  forma?: Forma;
  /** meta contable opcional, p. ej. 10000 seguidores */
  meta?: number;
  progreso?: number;
  actualizado: number;
}

export interface Campana {
  id: string;
  anio: number;
  /** 1-12 */
  mes: number;
  titulo: string;
  objetivoId?: string;
  meta?: number;
  progreso?: number;
  actualizado: number;
}

export interface Plantilla {
  id: string;
  nombre: string;
  color: string;
  forma?: Forma;
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

export const COLORES_CAT: { valor: string; nombre: string }[] = [
  { valor: 'var(--cat-1)', nombre: 'Rosa' },
  { valor: 'var(--cat-2)', nombre: 'Naranja' },
  { valor: 'var(--cat-3)', nombre: 'Ámbar' },
  { valor: 'var(--cat-4)', nombre: 'Lima' },
  { valor: 'var(--cat-5)', nombre: 'Verde' },
  { valor: 'var(--cat-6)', nombre: 'Turquesa' },
  { valor: 'var(--cat-7)', nombre: 'Cian' },
  { valor: 'var(--cat-8)', nombre: 'Azul' },
  { valor: 'var(--cat-9)', nombre: 'Violeta' },
  { valor: 'var(--cat-10)', nombre: 'Magenta' },
  { valor: 'var(--cat-11)', nombre: 'Arena' },
  { valor: 'var(--cat-12)', nombre: 'Pizarra' }
];

export const FORMAS: { valor: Forma; nombre: string }[] = [
  { valor: 'circulo', nombre: 'Círculo' },
  { valor: 'cuadrado', nombre: 'Cuadrado' },
  { valor: 'triangulo', nombre: 'Triángulo' },
  { valor: 'rombo', nombre: 'Rombo' },
  { valor: 'hexagono', nombre: 'Hexágono' },
  { valor: 'estrella', nombre: 'Estrella' },
  { valor: 'gota', nombre: 'Gota' },
  { valor: 'anillo', nombre: 'Anillo' },
  { valor: 'barra', nombre: 'Barra' }
];

export function nombreColor(valor: string): string {
  return COLORES_CAT.find((c) => c.valor === valor)?.nombre ?? 'Color';
}

export function nombreForma(valor: Forma): string {
  return FORMAS.find((f) => f.valor === valor)?.nombre ?? 'Forma';
}

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

export const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
