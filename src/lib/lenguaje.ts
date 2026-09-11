/**
 * Analizador de órdenes en español. Todo ocurre aquí dentro: sin red, sin claves,
 * sin mandar a ningún sitio lo que dictas. Entiende el dominio de la app
 * (bloques, horas, días), no cualquier frase del mundo.
 *
 * Ejemplo: «cambia mi reunión de hoy de las 18:00 para mañana a las 16:00»
 */

import type { Bloque } from './tipos';
import { MIN_BLOQUE } from './tipos';
import { hhmm, hoyISO, iso, desdeISO, sumarDias, fechaLarga, duracionLegible } from './tiempo';

export type Accion = 'mover' | 'crear' | 'borrar' | 'completar' | 'duracion' | 'desconocido';

export interface Paso {
  etiqueta: string;
  valor: string;
  estado: 'ok' | 'duda' | 'falta';
}

export interface Lectura {
  frase: string;
  accion: Accion;
  pasos: Paso[];
  /** cuando hay más de un bloque posible, el usuario elige */
  candidatos: Bloque[];
  objetivo?: Bloque;
  fechaDestino?: string;
  inicioDestino?: number;
  duracionDestino?: number;
  titulo?: string;
  conflictos: Bloque[];
  aplicable: boolean;
  problema?: string;
}

// --- normalización -------------------------------------------------------

export function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // ojo: los dos puntos y el punto NO se tocan, que son separadores de hora (18:30, 18.30)
    .replace(/[¿?¡!,;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VERBOS: { accion: Accion; palabras: string[] }[] = [
  { accion: 'mover', palabras: ['mueve', 'mover', 'cambia', 'cambiar', 'pasa', 'pasar', 'aplaza', 'aplazar', 'retrasa', 'adelanta', 'lleva', 'llevar', 'mandalo', 'traslada'] },
  { accion: 'crear', palabras: ['crea', 'crear', 'anade', 'anadir', 'agrega', 'pon', 'poner', 'agenda', 'agendar', 'programa', 'apunta', 'mete', 'meter', 'reserva'] },
  { accion: 'borrar', palabras: ['borra', 'borrar', 'elimina', 'eliminar', 'quita', 'quitar', 'cancela', 'cancelar', 'anula'] },
  { accion: 'completar', palabras: ['completa', 'completar', 'termina', 'terminar', 'acaba', 'hecho', 'hecha', 'marca', 'listo'] },
  { accion: 'duracion', palabras: ['alarga', 'alargar', 'amplia', 'ampliar', 'acorta', 'acortar', 'reduce', 'reducir', 'dura'] }
];

const VACIAS = new Set([
  'el','la','los','las','un','una','unos','unas','mi','mis','tu','de','del','al','a','en','para','por','con','que','y','o','me','se','lo','le','esta','este','esa','ese','hoy','manana','ayer','pasado','proximo','proxima','viene','siguiente','las','hora','horas','minuto','minutos','min','cita','bloque','tarea'
]);

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const NUMEROS: Record<string, number> = {
  una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
  veintiuna: 21, veintiuno: 21, veintidos: 22, veintitres: 23
};

interface Marca<T> {
  valor: T;
  pos: number;
  texto: string;
}

// --- horas ---------------------------------------------------------------

function ajustarFranja(h: number, franja?: string): number {
  if (!franja) return h;
  if ((franja === 'tarde' || franja === 'noche') && h < 12) return h + 12;
  if (franja === 'madrugada' && h === 12) return 0;
  if (franja === 'manana' && h === 12) return 0;
  return h;
}

export function buscarHoras(t: string): Marca<number>[] {
  const out: Marca<number>[] = [];
  const vistos = new Set<number>();

  // 18:00 · 18.30 · 18h30
  const re1 = /\b(\d{1,2})[:.h](\d{2})\b/g;
  for (const m of t.matchAll(re1)) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 24 && min < 60) {
      out.push({ valor: h * 60 + min, pos: m.index ?? 0, texto: m[0] });
      vistos.add(m.index ?? 0);
    }
  }

  // a las 18 · a las seis y media de la tarde · para las 16
  const re2 =
    /\b(?:a|de|para|hasta|sobre)\s+las?\s+(\d{1,2}|\w+)(?:\s*y\s*(media|cuarto))?(?:\s*(?:de\s+la\s+|por\s+la\s+)?(manana|tarde|noche|madrugada))?/g;
  for (const m of t.matchAll(re2)) {
    const pos = m.index ?? 0;
    if ([...vistos].some((v) => Math.abs(v - pos) < 12)) continue;
    const crudo = m[1];
    const h = /^\d+$/.test(crudo) ? Number(crudo) : NUMEROS[crudo];
    if (h === undefined || h > 23) continue;
    const min = m[2] === 'media' ? 30 : m[2] === 'cuarto' ? 15 : 0;
    out.push({ valor: ajustarFranja(h, m[3]) * 60 + min, pos, texto: m[0] });
    vistos.add(pos);
  }

  return out.sort((a, b) => a.pos - b.pos);
}

// --- fechas --------------------------------------------------------------

export function buscarFechas(t: string, hoy: string): Marca<string>[] {
  const out: Marca<string>[] = [];

  const simples: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\bpasado\s+manana\b/g, () => sumarDias(hoy, 2)],
    [/\bmanana\b/g, () => sumarDias(hoy, 1)],
    [/\bhoy\b/g, () => hoy],
    [/\bayer\b/g, () => sumarDias(hoy, -1)]
  ];
  for (const [re, fn] of simples) {
    for (const m of t.matchAll(re)) {
      // "por la mañana" es franja horaria, no el día de mañana
      const antes = t.slice(Math.max(0, (m.index ?? 0) - 10), m.index ?? 0);
      if (/\b(la|de\s+la|por\s+la)\s*$/.test(antes)) continue;
      out.push({ valor: fn(m), pos: m.index ?? 0, texto: m[0] });
    }
  }

  // el martes · el próximo martes
  const reDia = /\b(?:el\s+)?(?:proximo\s+|siguiente\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/g;
  for (const m of t.matchAll(reDia)) {
    const objetivo = DIAS.indexOf(m[1]);
    const base = desdeISO(hoy);
    const delta = (objetivo - base.getDay() + 7) % 7 || 7;
    out.push({ valor: sumarDias(hoy, delta), pos: m.index ?? 0, texto: m[0] });
  }

  // el 15 · el día 15 · 15/09
  const reNum = /\b(?:el\s+)?(?:dia\s+)?(\d{1,2})\s*(?:\/\s*(\d{1,2}))?\s*(?:de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre))?\b/g;
  const MESES_N = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  for (const m of t.matchAll(reNum)) {
    if (!m[2] && !m[3]) continue; // un número suelto no es una fecha
    const d = desdeISO(hoy);
    const dia = Number(m[1]);
    const mes = m[2] ? Number(m[2]) - 1 : MESES_N.indexOf(m[3]);
    if (dia < 1 || dia > 31 || mes < 0) continue;
    out.push({ valor: iso(new Date(d.getFullYear(), mes, dia)), pos: m.index ?? 0, texto: m[0] });
  }

  return out.sort((a, b) => a.pos - b.pos);
}

// --- duración ------------------------------------------------------------

export function buscarDuracion(t: string): number | undefined {
  if (/\bhora\s+y\s+media\b/.test(t)) return 90;
  if (/\bmedia\s+hora\b/.test(t)) return 30;
  if (/\bcuarto\s+de\s+hora\b/.test(t)) return 15;

  const min = t.match(/\b(\d{1,3})\s*(?:min|mins|minutos?)\b/);
  if (min) return Number(min[1]);

  const hor = t.match(/\b(\d{1,2}|\w+)\s*(?:h|horas?)\b/);
  if (hor) {
    const n = /^\d+$/.test(hor[1]) ? Number(hor[1]) : NUMEROS[hor[1]];
    if (n) return n * 60;
  }
  return undefined;
}

// --- bloque objetivo -----------------------------------------------------

function tokens(t: string): string[] {
  return normalizar(t)
    .split(' ')
    .filter((p) => p.length > 2 && !VACIAS.has(p) && !/^\d+$/.test(p));
}

function puntuar(b: Bloque, palabras: string[], fecha?: string, inicio?: number): number {
  let p = 0;
  const suyas = tokens(b.titulo);
  for (const w of palabras) {
    if (suyas.some((s) => s.startsWith(w.slice(0, 4)) || w.startsWith(s.slice(0, 4)))) p += 2;
  }
  if (fecha && b.fecha === fecha) p += 3;
  if (inicio !== undefined && b.inicioMin === inicio) p += 4;
  return p;
}

/**
 * El análisis trabaja sin tildes ni mayúsculas; para el título se recuperan del
 * texto tal y como lo dijo el usuario.
 */
function recuperarOriginal(original: string, limpio: string): string {
  if (!limpio) return 'Bloque';
  const quedan = new Set(limpio.split(' '));
  const palabras = original
    .split(/\s+/)
    .filter((p) => quedan.has(normalizar(p).replace(/[^a-z0-9]/g, '')));
  const texto = (palabras.length ? palabras.join(' ') : limpio).trim();
  return texto ? texto[0].toUpperCase() + texto.slice(1) : 'Bloque';
}

// --- interpretación ------------------------------------------------------

export interface Contexto {
  hoy: string;
  /** bloques de la ventana visible (semana y mes cargados) */
  bloques: Bloque[];
  tramo: number;
}

export function interpretar(fraseCruda: string, ctx: Contexto): Lectura {
  const frase = fraseCruda.trim();
  const t = normalizar(frase);
  const pasos: Paso[] = [];

  const accion = VERBOS.find((v) => v.palabras.some((p) => new RegExp(`\\b${p}\\b`).test(t)))?.accion ?? 'desconocido';

  const base: Lectura = {
    frase,
    accion,
    pasos,
    candidatos: [],
    conflictos: [],
    aplicable: false
  };

  if (accion === 'desconocido') {
    pasos.push({ etiqueta: 'Acción', valor: 'no reconocida', estado: 'falta' });
    return {
      ...base,
      problema:
        'Prueba con un verbo claro: mover, crear, borrar, completar o alargar. Por ejemplo «mueve la edición a mañana a las 10».'
    };
  }

  const ETIQUETA: Record<Accion, string> = {
    mover: 'Mover un bloque',
    crear: 'Crear un bloque',
    borrar: 'Borrar un bloque',
    completar: 'Marcar como hecho',
    duracion: 'Cambiar la duración',
    desconocido: '—'
  };
  pasos.push({ etiqueta: 'Acción', valor: ETIQUETA[accion], estado: 'ok' });

  const horas = buscarHoras(t);
  const fechas = buscarFechas(t, ctx.hoy);
  const duracion = buscarDuracion(t);

  // --- crear: no hay bloque previo que encontrar ---
  if (accion === 'crear') {
    const fecha = fechas.at(-1)?.valor ?? ctx.hoy;
    const inicio = horas.at(-1)?.valor;
    let limpio = t;
    for (const m of [...horas, ...fechas]) limpio = limpio.replace(m.texto, ' ');
    limpio = limpio.replace(/\b(?:crea|crear|anade|anadir|agrega|pon|poner|agenda|agendar|programa|apunta|mete|meter|reserva)\b/g, ' ');
    limpio = limpio.replace(/\b(?:media\s+hora|hora\s+y\s+media|cuarto\s+de\s+hora)\b/g, ' ');
    limpio = limpio.replace(/\b(?:\d{1,3}|[a-z]+)\s*(?:min|mins|minutos?|horas?)\b/g, ' ');
    limpio = limpio.replace(/\b\d{1,3}\s*h\b/g, ' ');
    limpio = limpio.replace(/\b(?:de|un|una|el|la|los|las|para|por|a|que|dure)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const titulo = recuperarOriginal(frase, limpio);

    pasos.push({ etiqueta: 'Título', valor: titulo, estado: limpio ? 'ok' : 'duda' });
    pasos.push({ etiqueta: 'Día', valor: fechaLarga(fecha), estado: fechas.length ? 'ok' : 'duda' });
    pasos.push({
      etiqueta: 'Hora',
      valor: inicio !== undefined ? hhmm(inicio) : 'primer hueco libre',
      estado: inicio !== undefined ? 'ok' : 'duda'
    });
    pasos.push({
      etiqueta: 'Duración',
      valor: duracionLegible(duracion ?? ctx.tramo),
      estado: duracion ? 'ok' : 'duda'
    });

    return {
      ...base,
      titulo,
      fechaDestino: fecha,
      inicioDestino: inicio,
      duracionDestino: Math.max(MIN_BLOQUE, duracion ?? ctx.tramo),
      aplicable: true
    };
  }

  // --- el resto necesita encontrar un bloque existente ---
  const dosHoras = horas.length >= 2;
  const horaOrigen = dosHoras ? horas[0].valor : undefined;
  const fechaOrigen = fechas.length >= 2 ? fechas[0].valor : fechas.length === 1 && accion !== 'mover' ? fechas[0].valor : fechas[0]?.valor;

  const palabras = tokens(t).filter(
    (w) => !VERBOS.some((v) => v.palabras.some((p) => p.startsWith(w.slice(0, 4))))
  );

  const puntuados = ctx.bloques
    .map((b) => ({ b, p: puntuar(b, palabras, fechaOrigen, horaOrigen) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p);

  if (!puntuados.length) {
    pasos.push({ etiqueta: 'Bloque', valor: 'no encontrado', estado: 'falta' });
    return { ...base, problema: 'No encuentro ningún bloque que encaje con esa descripción.' };
  }

  const mejor = puntuados[0];
  const empatados = puntuados.filter((x) => x.p === mejor.p).map((x) => x.b);
  if (empatados.length > 1) {
    pasos.push({ etiqueta: 'Bloque', valor: `${empatados.length} posibles`, estado: 'duda' });
    return { ...base, candidatos: empatados.slice(0, 5), problema: 'Dime cuál de estos.' };
  }

  const objetivo = mejor.b;
  pasos.push({
    etiqueta: 'Bloque',
    valor: `${objetivo.titulo} · ${fechaLarga(objetivo.fecha)} a las ${hhmm(objetivo.inicioMin)}`,
    // coincidencia floja: se propone, pero se avisa de que no está claro
    estado: mejor.p >= 3 ? 'ok' : 'duda'
  });

  if (accion === 'borrar' || accion === 'completar') {
    return { ...base, objetivo, aplicable: true };
  }

  if (accion === 'duracion') {
    const acorta = /\b(acorta|acortar|reduce|reducir)\b/.test(t);
    const nueva = duracion
      ? /\b(a|en)\s+\d/.test(t) && !acorta
        ? duracion
        : Math.max(MIN_BLOQUE, objetivo.duracionMin + (acorta ? -duracion : duracion))
      : undefined;
    if (nueva === undefined) {
      pasos.push({ etiqueta: 'Duración', valor: 'no entendida', estado: 'falta' });
      return { ...base, objetivo, problema: 'Dime cuántos minutos: «alarga la edición 30 minutos».' };
    }
    pasos.push({
      etiqueta: 'Duración',
      valor: `${duracionLegible(objetivo.duracionMin)} → ${duracionLegible(nueva)}`,
      estado: 'ok'
    });
    return { ...base, objetivo, duracionDestino: nueva, aplicable: true, conflictos: [] };
  }

  // --- mover ---
  const fechaDestino = fechas.length >= 2 ? fechas[1].valor : fechas.length === 1 ? fechas[0].valor : objetivo.fecha;
  const inicioDestino = dosHoras ? horas[1].valor : horas[0]?.valor ?? objetivo.inicioMin;

  pasos.push({
    etiqueta: 'De',
    valor: `${fechaLarga(objetivo.fecha)} · ${hhmm(objetivo.inicioMin)}`,
    estado: 'ok'
  });
  pasos.push({
    etiqueta: 'A',
    valor: `${fechaLarga(fechaDestino)} · ${hhmm(inicioDestino)}`,
    estado: horas.length || fechas.length ? 'ok' : 'duda'
  });

  const conflictos = ctx.bloques.filter(
    (b) =>
      b.id !== objetivo.id &&
      b.fecha === fechaDestino &&
      inicioDestino < b.inicioMin + b.duracionMin &&
      inicioDestino + objetivo.duracionMin > b.inicioMin
  );
  if (conflictos.length) {
    pasos.push({
      etiqueta: 'Choca con',
      valor: conflictos.map((c) => `${c.titulo} (${hhmm(c.inicioMin)})`).join(', '),
      estado: 'duda'
    });
  }

  return { ...base, objetivo, fechaDestino, inicioDestino, conflictos, aplicable: true };
}

export const EJEMPLOS = [
  'Cambia mi reunión de hoy de las 18:00 para mañana a las 16:00',
  'Crea grabar reel mañana a las 10 media hora',
  'Alarga la edición 30 minutos',
  'Marca como hecho el guion',
  'Mueve la miniatura al viernes a las 9'
];

export { hoyISO };
