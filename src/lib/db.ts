/**
 * Persistencia local (IndexedDB vía Dexie). Fuente de verdad en F1-F4:
 * la app funciona entera sin red y sin cuenta. La sync con Supabase llega en F5,
 * por eso cada registro lleva `actualizado` desde ya.
 */

import Dexie, { type Table } from 'dexie';
import type { Ajustes, Bloque, Plantilla } from './tipos';
import { AJUSTES_DEFECTO } from './tipos';

interface Kv {
  clave: string;
  valor: unknown;
}

class BaseDatos extends Dexie {
  bloques!: Table<Bloque, string>;
  plantillas!: Table<Plantilla, string>;
  kv!: Table<Kv, string>;

  constructor() {
    super('mai-focus');
    this.version(1).stores({
      bloques: 'id, fecha, [fecha+inicioMin]',
      plantillas: 'id',
      kv: 'clave'
    });
  }
}

export const db = new BaseDatos();

export const PLANTILLAS_FABRICA: Plantilla[] = [
  { id: 'guion', nombre: 'Guion', color: 'var(--cat-6)', duracionMin: 30, energia: 'alta', fabrica: true },
  { id: 'grabar', nombre: 'Grabar', color: 'var(--cat-1)', duracionMin: 60, energia: 'alta', fabrica: true },
  { id: 'editar', nombre: 'Editar', color: 'var(--cat-5)', duracionMin: 90, energia: 'media', fabrica: true },
  { id: 'miniatura', nombre: 'Miniatura', color: 'var(--cat-3)', duracionMin: 30, energia: 'media', fabrica: true },
  { id: 'publicar', nombre: 'Publicar', color: 'var(--cat-4)', duracionMin: 15, energia: 'baja', fabrica: true },
  { id: 'pausa', nombre: 'Pausa', color: 'var(--cat-2)', duracionMin: 10, energia: 'baja', fabrica: true }
];

export async function sembrarPlantillas(): Promise<void> {
  if ((await db.plantillas.count()) === 0) {
    await db.plantillas.bulkPut(PLANTILLAS_FABRICA);
  }
}

export async function leerAjustes(): Promise<Ajustes> {
  const fila = await db.kv.get('ajustes');
  return { ...AJUSTES_DEFECTO, ...((fila?.valor as Partial<Ajustes>) ?? {}) };
}

export async function escribirAjustes(a: Ajustes): Promise<void> {
  await db.kv.put({ clave: 'ajustes', valor: a });
}

export function bloquesDe(fecha: string): Promise<Bloque[]> {
  return db.bloques.where('fecha').equals(fecha).sortBy('inicioMin');
}

export function bloquesDeRango(fechas: string[]): Promise<Bloque[]> {
  return db.bloques.where('fecha').anyOf(fechas).toArray();
}

export function guardarBloque(b: Bloque): Promise<string> {
  return db.bloques.put({ ...b, actualizado: Date.now() });
}

export function borrarBloque(id: string): Promise<void> {
  return db.bloques.delete(id);
}

export function nuevoId(): string {
  return crypto.randomUUID();
}
