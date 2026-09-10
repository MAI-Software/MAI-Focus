/** Estado global de la app (runes). Toda escritura pasa por aquí y persiste al momento. */

import {
  bloquesDe,
  bloquesDeRango,
  borrarBloque,
  db,
  escribirAjustes,
  guardarBloque,
  leerAjustes,
  nuevoId,
  sembrarPlantillas
} from './db';
import type { Ajustes, Bloque, Plantilla, Tramo } from './tipos';
import { AJUSTES_DEFECTO, MIN_BLOQUE } from './tipos';
import { ahoraMin, hoyISO, limitar, semanaDe, snap, sumarDias } from './tiempo';

class Estado {
  ajustes = $state<Ajustes>({ ...AJUSTES_DEFECTO });
  plantillas = $state<Plantilla[]>([]);
  fecha = $state<string>(hoyISO());
  bloques = $state<Bloque[]>([]);
  semana = $state<Bloque[]>([]);
  ahora = $state<number>(ahoraMin());
  listo = $state(false);

  async init() {
    await sembrarPlantillas();
    this.ajustes = await leerAjustes();
    this.plantillas = await db.plantillas.toArray();
    await this.recargar();
    this.listo = true;
    this.aplicarCalma();
    // el reloj manda en una app de tiempo: se refresca solo
    setInterval(() => (this.ahora = ahoraMin()), 30_000);
  }

  async recargar() {
    this.bloques = await bloquesDe(this.fecha);
    this.semana = await bloquesDeRango(semanaDe(this.fecha));
  }

  async irA(fecha: string) {
    this.fecha = fecha;
    await this.recargar();
  }

  async setAjustes(parcial: Partial<Ajustes>) {
    this.ajustes = { ...this.ajustes, ...parcial };
    await escribirAjustes(this.ajustes);
    this.aplicarCalma();
  }

  aplicarCalma() {
    document.documentElement.dataset.calma = String(this.ajustes.calma);
  }

  get tramo(): Tramo {
    return this.ajustes.tramoMin;
  }

  bloquesDeFecha(fecha: string): Bloque[] {
    return this.semana.filter((b) => b.fecha === fecha).sort((a, b) => a.inicioMin - b.inicioMin);
  }

  /** Bloque en curso ahora mismo (solo si la fecha mostrada es hoy). */
  get actual(): Bloque | undefined {
    if (this.fecha !== hoyISO()) return undefined;
    return this.bloques.find(
      (b) => b.estado !== 'hecho' && b.inicioMin <= this.ahora && b.inicioMin + b.duracionMin > this.ahora
    );
  }

  /** Siguiente bloque pendiente del día mostrado. */
  get siguiente(): Bloque | undefined {
    const ref = this.fecha === hoyISO() ? this.ahora : -1;
    return this.bloques.find((b) => b.estado === 'pendiente' && b.inicioMin > ref);
  }

  /** Primer hueco libre a partir de ahora (o del inicio del día), alineado al tramo. */
  huecoSugerido(duracionMin: number): number {
    const { diaInicioMin, diaFinMin } = this.ajustes;
    const base = this.fecha === hoyISO() ? Math.max(diaInicioMin, this.ahora) : diaInicioMin;
    let inicio = limitar(snap(base, this.tramo), diaInicioMin, diaFinMin - duracionMin);
    const ordenados = [...this.bloques].sort((a, b) => a.inicioMin - b.inicioMin);
    for (const b of ordenados) {
      const solapa = inicio < b.inicioMin + b.duracionMin && inicio + duracionMin > b.inicioMin;
      if (solapa) inicio = snap(b.inicioMin + b.duracionMin, this.tramo);
    }
    return limitar(inicio, diaInicioMin, diaFinMin - duracionMin);
  }

  async crear(datos: Partial<Bloque> & { titulo: string }): Promise<Bloque> {
    const duracionMin = Math.max(MIN_BLOQUE, datos.duracionMin ?? this.tramo);
    const bloque: Bloque = {
      id: nuevoId(),
      fecha: datos.fecha ?? this.fecha,
      inicioMin: datos.inicioMin ?? this.huecoSugerido(duracionMin),
      duracionMin,
      titulo: datos.titulo,
      tipo: datos.tipo ?? 'libre',
      color: datos.color ?? 'var(--cat-5)',
      energia: datos.energia ?? 'media',
      estado: 'pendiente',
      nota: datos.nota,
      actualizado: Date.now()
    };
    await guardarBloque(bloque);
    await this.recargar();
    return bloque;
  }

  async actualizar(id: string, parcial: Partial<Bloque>) {
    const previo = this.bloques.find((b) => b.id === id) ?? this.semana.find((b) => b.id === id);
    if (!previo) return;
    await guardarBloque({ ...previo, ...parcial });
    await this.recargar();
  }

  async borrar(id: string) {
    await borrarBloque(id);
    await this.recargar();
  }

  /** Nunca "fallado": lo que no se hizo se mueve, no se castiga. */
  async moverAManana(id: string) {
    const b = this.bloques.find((x) => x.id === id);
    if (!b) return;
    await this.actualizar(id, { fecha: sumarDias(b.fecha, 1), estado: 'pendiente' });
  }

  async alternarHecho(id: string) {
    const b = this.bloques.find((x) => x.id === id) ?? this.semana.find((x) => x.id === id);
    if (!b) return;
    await this.actualizar(id, { estado: b.estado === 'hecho' ? 'pendiente' : 'hecho' });
  }

  async empezar(id: string) {
    await this.actualizar(id, { estado: 'en_curso' });
  }
}

export const estado = new Estado();
