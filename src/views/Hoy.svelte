<script lang="ts">
  import Vista from '../lib/Vista.svelte';
  import Rejilla from '../lib/Rejilla.svelte';
  import BloqueHoja from '../lib/BloqueHoja.svelte';
  import VozHoja from '../lib/VozHoja.svelte';
  import { estado } from '../lib/estado.svelte';
  import type { Bloque } from '../lib/tipos';
  import { PX_POR_MIN } from '../lib/tipos';
  import { duracionLegible, etiquetaRelativa, fechaLarga, hhmm, hoyISO, sumarDias } from '../lib/tiempo';

  let hoja = $state<{ abierta: boolean; bloque: Bloque | null }>({ abierta: false, bloque: null });
  let voz = $state(false);

  const actual = $derived(estado.actual);
  const siguiente = $derived(estado.siguiente);
  const restante = $derived(actual ? actual.inicioMin + actual.duracionMin - estado.ahora : 0);
  const progreso = $derived(actual ? 1 - restante / actual.duracionMin : 0);
  const rel = $derived(etiquetaRelativa(estado.fecha));

  function abrirNuevo() {
    hoja = { abierta: true, bloque: null };
  }

  function abrirBloque(b: Bloque) {
    hoja = { abierta: true, bloque: b };
  }

  // al entrar, la vista se coloca sola en la hora actual: sin buscar nada
  let colocado = false;
  $effect(() => {
    if (!estado.listo || colocado) return;
    colocado = true;
    const px = PX_POR_MIN[estado.tramo];
    const y = (estado.ahora - estado.ajustes.diaInicioMin) * px;
    requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, y - 160) }));
  });
</script>

<Vista titulo={rel ?? fechaLarga(estado.fecha)} sub={rel ? fechaLarga(estado.fecha) : undefined}>
  <div class="dias">
    <button type="button" onclick={() => estado.irA(sumarDias(estado.fecha, -1))} aria-label="Día anterior">‹</button>
    {#if estado.fecha !== hoyISO()}
      <button type="button" class="volver" onclick={() => estado.irA(hoyISO())}>Volver a hoy</button>
    {:else}
      <span class="sep"></span>
    {/if}
    <button type="button" onclick={() => estado.irA(sumarDias(estado.fecha, 1))} aria-label="Día siguiente">›</button>
  </div>

  <div class="foco" class:vacia={!actual && !siguiente}>
    {#if actual}
      <p class="rotulo">Ahora</p>
      <h2>{actual.titulo}</h2>
      <p class="detalle tabular">Quedan {duracionLegible(Math.max(restante, 0))} · acaba a las {hhmm(actual.inicioMin + actual.duracionMin)}</p>
      <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progreso * 100)}>
        <span style="width:{Math.min(100, Math.max(0, progreso * 100))}%"></span>
      </div>
      <button class="accion" type="button" onclick={() => estado.alternarHecho(actual.id)}>Hecho</button>
    {:else if siguiente}
      <p class="rotulo">Sigue</p>
      <h2>{siguiente.titulo}</h2>
      <p class="detalle tabular">A las {hhmm(siguiente.inicioMin)} · {duracionLegible(siguiente.duracionMin)}</p>
      <button class="accion" type="button" onclick={() => estado.empezar(siguiente.id)}>Empezar 5 min</button>
    {:else}
      <p class="rotulo">Sin nada en marcha</p>
      <p class="detalle">Añade un bloque y empieza por lo más pequeño.</p>
    {/if}
  </div>

  <Rejilla bloques={estado.bloques} onEditar={abrirBloque} />
</Vista>

<button class="fab micro" type="button" onclick={() => (voz = true)} aria-label="Ordenar por voz">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
    <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
    <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V21.5M8.5 21.5h7" />
  </svg>
</button>

<button class="fab" type="button" onclick={abrirNuevo} aria-label="Añadir bloque">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
</button>

{#if voz}
  <VozHoja onCerrar={() => (voz = false)} />
{/if}

{#if hoja.abierta}
  <BloqueHoja bloque={hoja.bloque} onCerrar={() => (hoja = { abierta: false, bloque: null })} />
{/if}

<style>
  .dias {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
    gap: var(--sp-2);
    margin-bottom: var(--sp-3);
  }

  .dias button {
    min-height: 44px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: var(--fs-lg);
  }

  .volver {
    font-size: var(--fs-sm) !important;
    font-weight: 500;
  }

  .sep {
    display: block;
  }

  .foco {
    padding: var(--sp-4);
    margin-bottom: var(--sp-4);
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .foco.vacia {
    border-style: dashed;
  }

  .rotulo {
    margin: 0 0 var(--sp-1);
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--primary);
  }

  h2 {
    font-size: var(--fs-lg);
  }

  .detalle {
    margin: var(--sp-1) 0 0;
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .barra {
    height: 6px;
    margin-top: var(--sp-3);
    border-radius: 3px;
    background: var(--surface-2);
    overflow: hidden;
  }

  .barra span {
    display: block;
    height: 100%;
    background: var(--primary);
    transition: width var(--dur-in) var(--ease-out);
  }

  .accion {
    width: 100%;
    min-height: 48px;
    margin-top: var(--sp-3);
    border-radius: var(--radius-sm);
    background: var(--primary-accion);
    color: var(--on-primary);
    font-weight: 600;
  }

  .accion:active {
    transform: scale(0.98);
  }

  .fab {
    position: fixed;
    right: var(--sp-4);
    bottom: calc(var(--nav-h) + var(--sp-3));
    z-index: calc(var(--z-nav) + 1);
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: var(--primary-accion);
    color: var(--on-primary);
    box-shadow: 0 6px 20px rgba(234, 88, 12, 0.35);
    transition: transform var(--dur-out) var(--ease-out);
  }

  .fab:active {
    transform: scale(0.94);
  }

  /* el micro va al lado del +, no lo sustituye: dictar es un atajo, no el camino */
  .micro {
    right: calc(var(--sp-4) + 68px);
    width: 52px;
    height: 52px;
    background: var(--surface);
    color: var(--fg);
    border: 1px solid var(--border);
    box-shadow: 0 6px 20px rgba(2, 6, 23, 0.35);
  }
</style>
