<script lang="ts">
  import Vista from '../lib/Vista.svelte';
  import BloqueHoja from '../lib/BloqueHoja.svelte';
  import Marca from '../lib/Marca.svelte';
  import { estado } from '../lib/estado.svelte';
  import { router } from '../lib/router.svelte';
  import type { Bloque } from '../lib/tipos';
  import { diaCorto, duracionLegible, hhmm, hoyISO, numeroDia, semanaDe, sumarDias } from '../lib/tiempo';

  const dias = $derived(semanaDe(estado.fecha));

  let hoja = $state<Bloque | null>(null);

  // --- arrastrar un bloque de un día a otro ------------------------------
  let fantasma = $state<{ x: number; y: number; titulo: string; color: string } | null>(null);
  let destino = $state<string | null>(null);
  let origen: Bloque | null = null;
  let x0 = 0;
  let y0 = 0;
  let movido = false;
  /** rectángulos de los días, cacheados al empezar: nada de hit-testing por píxel */
  let zonas: { fecha: string; r: DOMRect }[] = [];

  function medirZonas() {
    zonas = [...document.querySelectorAll<HTMLElement>('[data-fecha]')].map((el) => ({
      fecha: el.dataset.fecha as string,
      r: el.getBoundingClientRect()
    }));
  }

  function zonaEn(x: number, y: number): string | null {
    return zonas.find((z) => y >= z.r.top && y <= z.r.bottom && x >= z.r.left && x <= z.r.right)?.fecha ?? null;
  }

  function abajo(e: PointerEvent, b: Bloque) {
    // un evento de hora fija tampoco cambia de día por accidente
    if (b.fijo) {
      origen = b;
      movido = false;
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    origen = b;
    x0 = e.clientX;
    y0 = e.clientY;
    movido = false;
    medirZonas();
  }

  function mover(e: PointerEvent) {
    if (!origen) return;
    if (!movido && Math.hypot(e.clientX - x0, e.clientY - y0) < 8) return;
    movido = true;
    fantasma = { x: e.clientX, y: e.clientY, titulo: origen.titulo, color: estado.colorDe(origen) };
    destino = zonaEn(e.clientX, e.clientY);
  }

  async function arriba(b: Bloque) {
    const dest = destino;
    const hubo = movido;
    origen = null;
    movido = false;
    fantasma = null;
    destino = null;
    if (!hubo) {
      hoja = b; // toque limpio: abrir el bloque
      return;
    }
    if (dest && dest !== b.fecha) await estado.moverAFecha(b.id, dest);
  }

  function totalDe(fecha: string): number {
    return estado
      .bloquesDeFecha(fecha)
      .filter((b) => b.estado !== 'hecho')
      .reduce((s, b) => s + b.duracionMin, 0);
  }

  async function abrirDia(fecha: string) {
    await estado.irA(fecha);
    router.ir('hoy');
  }
</script>

<Vista titulo="Semana" sub="Arrastra un bloque a otro día; toca el día para trabajarlo">
  <div class="nav">
    <button type="button" onclick={() => estado.irA(sumarDias(estado.fecha, -7))} aria-label="Semana anterior">‹</button>
    <button type="button" class="volver" onclick={() => estado.irA(hoyISO())}>Semana de hoy</button>
    <button type="button" onclick={() => estado.irA(sumarDias(estado.fecha, 7))} aria-label="Semana siguiente">›</button>
  </div>

  <ul class="lista">
    {#each dias as d (d)}
      {@const bloques = estado.bloquesDeFecha(d)}
      {@const total = totalDe(d)}
      <li class="dia" class:hoy={d === hoyISO()} class:destino={destino === d} data-fecha={d}>
        <div class="cab">
          <button type="button" class="abrir" onclick={() => abrirDia(d)}>
            {diaCorto(d)} <span class="num tabular">{numeroDia(d)}</span>
          </button>
          <span class="meta tabular">{bloques.length ? duracionLegible(total) : 'libre'}</span>
        </div>

        {#if bloques.length}
          <div class="chips">
            {#each bloques as b (b.id)}
              <div
                class="chip"
                class:hecho={b.estado === 'hecho'}
                class:fijo={b.fijo}
                style="--c:{estado.colorDe(b)}"
                role="button"
                tabindex="0"
                aria-label="{b.titulo} a las {hhmm(b.inicioMin)}"
                onpointerdown={(e) => abajo(e, b)}
                onpointermove={mover}
                onpointerup={() => arriba(b)}
                onpointercancel={() => arriba(b)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    hoja = b;
                  }
                }}
              >
                <Marca forma={estado.formaDe(b)} color={estado.colorDe(b)} size={12} />
                <span class="hora tabular">{hhmm(b.inicioMin)}</span>
                <span class="tit">{b.titulo}</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="libre">Sin bloques</p>
        {/if}
      </li>
    {/each}
  </ul>
</Vista>

{#if fantasma}
  <div class="fantasma" style="left:{fantasma.x}px; top:{fantasma.y}px; --c:{fantasma.color}" aria-hidden="true">
    {fantasma.titulo}
  </div>
{/if}

{#if hoja}
  <BloqueHoja bloque={hoja} onCerrar={() => (hoja = null)} />
{/if}

<style>
  .nav {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  .nav button {
    min-height: 44px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    font-size: var(--fs-lg);
  }

  .volver {
    font-size: var(--fs-sm) !important;
    font-weight: 500;
  }

  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  .dia {
    padding: var(--sp-3);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    transition: border-color var(--dur-out) var(--ease-out);
  }

  .hoy {
    border-color: var(--primary);
  }

  /* destino de suelta: se ve dónde va a caer antes de soltar */
  .destino {
    border-color: var(--focus-ring);
    background: color-mix(in srgb, var(--primary) 12%, var(--surface));
  }

  .cab {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
  }

  .abrir {
    min-height: 44px;
    font-weight: 600;
    text-transform: capitalize;
  }

  .num {
    color: var(--fg-muted);
    font-weight: 500;
  }

  .meta {
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-1);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    max-width: 100%;
    min-height: 36px;
    padding: 0 var(--sp-3);
    border-radius: 999px;
    border-left: 4px solid var(--c);
    background: color-mix(in srgb, var(--c) 20%, var(--surface-2));
    font-size: var(--fs-sm);
    touch-action: none;
  }

  .chip.fijo {
    background: var(--surface-2);
    border: 1px solid var(--c);
    border-left-width: 4px;
  }

  .chip.hecho {
    background: color-mix(in srgb, var(--success) 16%, var(--surface-2));
    border-left-color: var(--success);
  }

  .chip.hecho .tit {
    text-decoration: line-through;
    color: var(--fg-muted);
  }

  .hora {
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .tit {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .libre {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .fantasma {
    position: fixed;
    z-index: var(--z-modal);
    transform: translate(-50%, -140%);
    padding: var(--sp-2) var(--sp-3);
    border-radius: 999px;
    border-left: 4px solid var(--c);
    background: var(--surface);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
    font-size: var(--fs-sm);
    font-weight: 600;
    pointer-events: none;
  }
</style>
