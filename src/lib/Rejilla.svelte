<script lang="ts">
  /**
   * Rejilla del día: escala real de tiempo (un minuto siempre mide lo mismo),
   * bloques arrastrables y redimensionables con snap al tramo configurado.
   */
  import Marca from './Marca.svelte';
  import type { Bloque } from './tipos';
  import { MIN_BLOQUE, PX_POR_MIN } from './tipos';
  import { estado } from './estado.svelte';
  import { duracionLegible, hhmm, hoyISO, limitar, snap } from './tiempo';

  let {
    bloques,
    onEditar
  }: { bloques: Bloque[]; onEditar: (b: Bloque) => void } = $props();

  const px = $derived(PX_POR_MIN[estado.tramo]);
  const inicioDia = $derived(estado.ajustes.diaInicioMin);
  const finDia = $derived(estado.ajustes.diaFinMin);
  const alto = $derived((finDia - inicioDia) * px);

  const horas = $derived(
    Array.from({ length: Math.ceil((finDia - inicioDia) / 60) + 1 }, (_, i) => inicioDia + i * 60)
  );
  /** las líneas de tramo solo se pintan si no amontonan la vista */
  const verTramos = $derived(estado.tramo * px >= 14);
  const tramos = $derived(
    verTramos
      ? Array.from(
          { length: Math.floor((finDia - inicioDia) / estado.tramo) },
          (_, i) => inicioDia + i * estado.tramo
        )
      : []
  );

  const esHoy = $derived(estado.fecha === hoyISO());

  // --- arrastre / redimensión -------------------------------------------
  type Modo = 'mover' | 'redim';
  let previo = $state<{ id: string; inicioMin: number; duracionMin: number } | null>(null);

  let y0 = 0;
  let baseInicio = 0;
  let baseDur = 0;
  let modo: Modo = 'mover';
  let activoId: string | null = null;
  let movido = $state(false);

  /** los eventos de hora fija no se arrastran: se tocan y se editan */
  let tapFijo = $state(false);

  function abajo(e: PointerEvent, b: Bloque, m: Modo) {
    if (b.fijo) {
      tapFijo = true;
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    y0 = e.clientY;
    baseInicio = b.inicioMin;
    baseDur = b.duracionMin;
    modo = m;
    activoId = b.id;
    movido = false;
    previo = { id: b.id, inicioMin: b.inicioMin, duracionMin: b.duracionMin };
  }

  function mover(e: PointerEvent) {
    if (!activoId || !previo) return;
    const dy = e.clientY - y0;
    // umbral: sin él, cada toque movería el bloque sin querer
    if (!movido && Math.abs(dy) < 8) return;
    movido = true;
    const delta = snap(dy / px, estado.tramo);
    if (modo === 'mover') {
      previo = {
        ...previo,
        inicioMin: limitar(baseInicio + delta, inicioDia, finDia - baseDur)
      };
    } else {
      previo = {
        ...previo,
        duracionMin: limitar(baseDur + delta, MIN_BLOQUE, finDia - baseInicio)
      };
    }
  }

  async function arriba(b: Bloque) {
    if (tapFijo) {
      tapFijo = false;
      onEditar(b);
      return;
    }
    const p = previo;
    activoId = null;
    previo = null;
    if (!p) return;
    if (!movido) {
      onEditar(b); // toque limpio = abrir el bloque
      return;
    }
    if (p.inicioMin !== b.inicioMin || p.duracionMin !== b.duracionMin) {
      await estado.actualizar(b.id, { inicioMin: p.inicioMin, duracionMin: p.duracionMin });
    }
  }

  function vista(b: Bloque) {
    return previo?.id === b.id ? { ...b, ...previo } : b;
  }

  /**
   * Reparto en carriles: los bloques que se solapan comparten el ancho en vez de
   * taparse. Cada grupo de solape calcula cuántos carriles necesita y cada bloque
   * se mete en el primero que ya esté libre a su hora.
   */
  const carriles = $derived.by(() => {
    const mapa = new Map<string, { carril: number; total: number }>();
    const orden = bloques
      .map(vista)
      .sort((a, b) => a.inicioMin - b.inicioMin || b.duracionMin - a.duracionMin);

    let grupo: typeof orden = [];
    let finGrupo = -1;

    const cerrarGrupo = () => {
      if (!grupo.length) return;
      const finDeCarril: number[] = [];
      const asignado = new Map<string, number>();
      for (const b of grupo) {
        let c = finDeCarril.findIndex((fin) => fin <= b.inicioMin);
        if (c === -1) {
          c = finDeCarril.length;
          finDeCarril.push(0);
        }
        finDeCarril[c] = b.inicioMin + b.duracionMin;
        asignado.set(b.id, c);
      }
      for (const b of grupo) {
        mapa.set(b.id, { carril: asignado.get(b.id) ?? 0, total: finDeCarril.length });
      }
      grupo = [];
      finGrupo = -1;
    };

    for (const b of orden) {
      if (grupo.length && b.inicioMin >= finGrupo) cerrarGrupo();
      grupo.push(b);
      finGrupo = Math.max(finGrupo, b.inicioMin + b.duracionMin);
    }
    cerrarGrupo();
    return mapa;
  });
</script>

<div class="rejilla" style="height:{alto}px">
  {#each tramos as t (t)}
    <div class="linea tramo" style="top:{(t - inicioDia) * px}px"></div>
  {/each}

  {#each horas as h (h)}
    <div class="linea hora" style="top:{(h - inicioDia) * px}px"></div>
    <span class="etiqueta tabular" style="top:{(h - inicioDia) * px}px">{hhmm(h)}</span>
  {/each}

  {#if esHoy && estado.ahora >= inicioDia && estado.ahora <= finDia}
    <div class="ahora" style="top:{(estado.ahora - inicioDia) * px}px">
      <span class="punto"></span>
    </div>
  {/if}

  {#each bloques as b (b.id)}
    {@const v = vista(b)}
    {@const altoPx = v.duracionMin * px}
    {@const car = carriles.get(b.id) ?? { carril: 0, total: 1 }}
    <div
      class="bloque"
      class:hecho={b.estado === 'hecho'}
      class:curso={b.estado === 'en_curso'}
      class:arrastrando={previo?.id === b.id && movido}
      class:compacto={altoPx < 34}
      class:fijo={b.fijo}
      style="top:{(v.inicioMin - inicioDia) * px}px; height:{Math.max(altoPx, 22)}px; left:{(car.carril /
        car.total) *
        100}%; width:calc({100 / car.total}% - 3px); --c:{estado.colorDe(b)}"
      role="button"
      tabindex="0"
      aria-label="{b.titulo}, {hhmm(v.inicioMin)}, {duracionLegible(v.duracionMin)}{b.fijo
        ? ', hora fija'
        : ''}{car.total > 1 ? `, solapa con ${car.total - 1} más` : ''}"
      onpointerdown={(e) => abajo(e, b, 'mover')}
      onpointermove={mover}
      onpointerup={() => arriba(b)}
      onpointercancel={() => arriba(b)}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEditar(b);
        }
      }}
    >
      <div class="txt">
        <span class="tit">
          <Marca forma={estado.formaDe(b)} color={estado.colorDe(b)} size={12} />
          {b.titulo}
        </span>
        <span class="hora tabular">{hhmm(v.inicioMin)} · {duracionLegible(v.duracionMin)}</span>
      </div>
      {#if !b.fijo}
      <div
        class="asa"
        role="slider"
        tabindex="-1"
        aria-label="Cambiar duración de {b.titulo}"
        aria-valuenow={v.duracionMin}
        aria-valuemin={MIN_BLOQUE}
        aria-valuemax={finDia - v.inicioMin}
        onpointerdown={(e) => {
          e.stopPropagation();
          abajo(e, b, 'redim');
        }}
        onpointermove={mover}
        onpointerup={(e) => {
          e.stopPropagation();
          arriba(b);
        }}
      >
        <span></span>
      </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .rejilla {
    position: relative;
    margin-left: 52px;
    margin-right: var(--sp-3);
  }

  .linea {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    pointer-events: none;
  }

  .hora {
    background: var(--border);
  }

  .tramo {
    background: color-mix(in srgb, var(--border) 45%, transparent);
  }

  .etiqueta {
    position: absolute;
    left: -52px;
    transform: translateY(-50%);
    width: 44px;
    text-align: right;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
    pointer-events: none;
  }

  .ahora {
    position: absolute;
    left: -8px;
    right: 0;
    height: 2px;
    background: var(--primary);
    pointer-events: none;
    z-index: 3;
  }

  .punto {
    position: absolute;
    left: -3px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary);
  }

  .bloque {
    position: absolute;
    /* left y width los pone el reparto en carriles */
    display: flex;
    align-items: flex-start;
    padding: 4px var(--sp-2);
    border-radius: var(--radius-sm);
    border-left: 4px solid var(--c);
    background: color-mix(in srgb, var(--c) 22%, var(--surface));
    color: var(--fg);
    overflow: hidden;
    touch-action: none; /* el gesto es arrastrar el bloque, no scrollear */
    transition: box-shadow var(--dur-out) var(--ease-out);
  }

  .bloque:active {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 60%, transparent);
  }

  .arrastrando {
    z-index: 5;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  /* evento de hora fija: contorno sólido, sin relleno; se distingue sin leer */
  .fijo {
    background: var(--surface);
    border: 2px solid var(--c);
    border-left-width: 4px;
  }

  .hecho {
    background: color-mix(in srgb, var(--success) 16%, var(--surface));
    border-left-color: var(--success);
  }

  .hecho .tit {
    text-decoration: line-through;
    color: var(--fg-muted);
  }

  .curso {
    box-shadow: inset 0 0 0 2px var(--primary);
  }

  .txt {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .tit {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--fs-sm);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hora {
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .compacto .txt {
    flex-direction: row;
    align-items: baseline;
    gap: var(--sp-2);
  }

  .compacto .hora {
    font-size: 10px;
  }

  .asa {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 18px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 2px;
    cursor: ns-resize;
    touch-action: none;
  }

  .asa span {
    width: 28px;
    height: 3px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--fg) 35%, transparent);
  }
</style>
