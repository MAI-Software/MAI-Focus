/** Estado global de la app (runes). Toda escritura pasa por aquí y persiste al momento. */

import {
  bloquesDe,
  bloquesDeMes,
  bloquesDeRango,
  borrarBloque,
  campanasDe,
  db,
  escribirAjustes,
  guardarBloque,
  leerAjustes,
  nuevoId,
  objetivosDe,
  plano,
  sembrarPlantillas
} from './db';
import type { Ajustes, Bloque, Campana, Forma, Objetivo, Plantilla, Tramo } from './tipos';
import { AJUSTES_DEFECTO, MIN_BLOQUE } from './tipos';
import { ahoraMin, desdeISO, hoyISO, limitar, semanaDe, snap, sumarDias } from './tiempo';

class Estado {
  ajustes = $state<Ajustes>({ ...AJUSTES_DEFECTO });
  plantillas = $state<Plantilla[]>([]);
  fecha = $state<string>(hoyISO());
  bloques = $state<Bloque[]>([]);
  semana = $state<Bloque[]>([]);
  ahora = $state<number>(ahoraMin());
  listo = $state(false);

  // --- mapa (mes / año) ---
  anio = $state<number>(new Date().getFullYear());
  mes = $state<number>(new Date().getMonth() + 1);
  objetivos = $state<Objetivo[]>([]);
  campanas = $state<Campana[]>([]);
  bloquesMes = $state<Bloque[]>([]);

  async init() {
    await sembrarPlantillas();
    this.ajustes = await leerAjustes();
    this.plantillas = await db.plantillas.toArray();
    await this.recargar();
    await this.recargarMapa();
    this.listo = true;
    this.aplicarCalma();
    // el reloj manda en una app de tiempo: se refresca solo
    setInterval(() => (this.ahora = ahoraMin()), 30_000);
  }

  async recargar() {
    this.bloques = await bloquesDe(this.fecha);
    this.semana = await bloquesDeRango(semanaDe(this.fecha));
    if (this.listo) await this.recargarMapa();
  }

  /** Tras importar una copia: todo lo que vive en memoria se vuelve a leer del disco. */
  async recargarTodo() {
    this.ajustes = await leerAjustes();
    this.plantillas = await db.plantillas.toArray();
    await this.recargar();
    await this.recargarMapa();
    this.aplicarCalma();
  }

  async recargarMapa() {
    this.objetivos = await objetivosDe(this.anio);
    this.campanas = await campanasDe(this.anio);
    this.bloquesMes = await bloquesDeMes(this.anio, this.mes);
  }

  async irA(fecha: string) {
    this.fecha = fecha;
    const d = desdeISO(fecha);
    this.anio = d.getFullYear();
    this.mes = d.getMonth() + 1;
    await this.recargar();
  }

  async irAMes(anio: number, mes: number) {
    this.anio = anio;
    this.mes = mes;
    await this.recargarMapa();
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

  objetivo(id?: string): Objetivo | undefined {
    return id ? this.objetivos.find((o) => o.id === id) : undefined;
  }

  /** El color y la forma los manda el objetivo si el bloque cuelga de uno. */
  colorDe(b: Bloque): string {
    return this.objetivo(b.objetivoId)?.color ?? b.color;
  }

  formaDe(b: Bloque): Forma {
    return this.objetivo(b.objetivoId)?.forma ?? b.forma ?? 'circulo';
  }

  // --- bloques ----------------------------------------------------------
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
      forma: datos.forma ?? 'circulo',
      objetivoId: datos.objetivoId,
      fijo: datos.fijo ?? false,
      actualizado: Date.now()
    };
    await guardarBloque(bloque);
    await this.recargar();
    return bloque;
  }

  async actualizar(id: string, parcial: Partial<Bloque>) {
    const previo =
      this.bloques.find((b) => b.id === id) ??
      this.semana.find((b) => b.id === id) ??
      this.bloquesMes.find((b) => b.id === id);
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

  async moverAFecha(id: string, fecha: string) {
    await this.actualizar(id, { fecha, estado: 'pendiente' });
  }

  async alternarHecho(id: string) {
    const b = this.bloques.find((x) => x.id === id) ?? this.semana.find((x) => x.id === id);
    if (!b) return;
    await this.actualizar(id, { estado: b.estado === 'hecho' ? 'pendiente' : 'hecho' });
  }

  async empezar(id: string) {
    await this.actualizar(id, { estado: 'en_curso' });
  }

  // --- objetivos y campañas --------------------------------------------
  async guardarObjetivo(o: Partial<Objetivo> & { titulo: string; color: string }) {
    const fila: Objetivo = {
      id: o.id ?? nuevoId(),
      anio: o.anio ?? this.anio,
      titulo: o.titulo,
      color: o.color,
      forma: o.forma ?? 'circulo',
      meta: o.meta,
      progreso: o.progreso ?? 0,
      actualizado: Date.now()
    };
    await db.objetivos.put(plano(fila));
    await this.recargarMapa();
  }

  /** Al borrar un objetivo los bloques no se borran: se quedan huérfanos con su color propio. */
  async borrarObjetivo(id: string) {
    const previo = this.objetivos.find((o) => o.id === id);
    const hijos = await db.bloques.where('objetivoId').equals(id).toArray();
    await Promise.all(
      hijos.map((b) =>
        guardarBloque({
          ...b,
          objetivoId: undefined,
          color: previo?.color ?? b.color,
          forma: previo?.forma ?? b.forma
        })
      )
    );
    await db.campanas.where('anio').equals(this.anio).modify((c) => {
      if (c.objetivoId === id) c.objetivoId = undefined;
    });
    await db.objetivos.delete(id);
    await this.recargar();
    await this.recargarMapa();
  }

  async guardarCampana(c: Partial<Campana> & { titulo: string }) {
    const fila: Campana = {
      id: c.id ?? nuevoId(),
      anio: c.anio ?? this.anio,
      mes: c.mes ?? this.mes,
      titulo: c.titulo,
      objetivoId: c.objetivoId,
      meta: c.meta,
      progreso: c.progreso ?? 0,
      actualizado: Date.now()
    };
    await db.campanas.put(plano(fila));
    await this.recargarMapa();
  }

  async borrarCampana(id: string) {
    await db.campanas.delete(id);
    await this.recargarMapa();
  }

  // --- plantillas -------------------------------------------------------
  async guardarPlantilla(p: Partial<Plantilla> & { nombre: string; color: string; duracionMin: number }) {
    const fila: Plantilla = {
      id: p.id ?? nuevoId(),
      nombre: p.nombre,
      color: p.color,
      forma: p.forma ?? 'circulo',
      duracionMin: p.duracionMin,
      energia: p.energia ?? 'media',
      fabrica: p.fabrica
    };
    await db.plantillas.put(plano(fila));
    this.plantillas = await db.plantillas.toArray();
  }

  async borrarPlantilla(id: string) {
    await db.plantillas.delete(id);
    this.plantillas = await db.plantillas.toArray();
  }

  /** Minutos planificados por día del mes mostrado, para pintar la carga. */
  cargaPorDia(): Map<string, number> {
    const m = new Map<string, number>();
    for (const b of this.bloquesMes) {
      m.set(b.fecha, (m.get(b.fecha) ?? 0) + b.duracionMin);
    }
    return m;
  }
}

export const estado = new Estado();
