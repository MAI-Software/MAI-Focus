/** Utilidades de tiempo. Todo en minutos enteros desde medianoche: sin decimales ni líos de zona horaria. */

import { MIN_BLOQUE } from './tipos';

export function iso(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dia = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function hoyISO(): string {
  return iso(new Date());
}

export function desdeISO(s: string): Date {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function sumarDias(s: string, n: number): string {
  const d = desdeISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDe(s: string): string {
  const d = desdeISO(s);
  const off = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - off);
  return iso(d);
}

export function semanaDe(s: string): string[] {
  const l = lunesDe(s);
  return Array.from({ length: 7 }, (_, i) => sumarDias(l, i));
}

export function ahoraMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function hhmm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`;
}

/** "1 h 30 min" legible; el tiempo abstracto se escribe siempre en claro. */
export function duracionLegible(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function snap(min: number, tramo: number): number {
  return Math.round(min / tramo) * tramo;
}

export function limitar(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export { MIN_BLOQUE };

const FMT_LARGO = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const FMT_DIA = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });

export function fechaLarga(s: string): string {
  return FMT_LARGO.format(desdeISO(s));
}

export function diaCorto(s: string): string {
  return FMT_DIA.format(desdeISO(s)).replace('.', '');
}

export function numeroDia(s: string): number {
  return desdeISO(s).getDate();
}

export function etiquetaRelativa(s: string): string | null {
  const h = hoyISO();
  if (s === h) return 'Hoy';
  if (s === sumarDias(h, 1)) return 'Mañana';
  if (s === sumarDias(h, -1)) return 'Ayer';
  return null;
}
