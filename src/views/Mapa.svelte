<script lang="ts">
  import Vista from '../lib/Vista.svelte';
  import MetaHoja from '../lib/MetaHoja.svelte';
  import { estado } from '../lib/estado.svelte';
  import { router } from '../lib/router.svelte';
  import type { Campana, Objetivo } from '../lib/tipos';
  import { MESES, MESES_CORTOS } from '../lib/tipos';
  import { desdeISO, duracionLegible, hoyISO, iso } from '../lib/tiempo';

  let modo = $state<'mes' | 'anio'>('mes');
  let hoja = $state<{ tipo: 'objetivo' | 'campana'; valor: Objetivo | Campana | null } | null>(null);

  const campanasMes = $derived(estado.campanas.filter((c) => c.mes === estado.mes));
  const carga = $derived(estado.cargaPorDia());
  const cargaMaxima = $derived(Math.max(60, ...carga.values()));

  /** Rejilla del mes empezando en lunes. */
  const celdas = $derived.by(() => {
    const primero = new Date(estado.anio, estado.mes - 1, 1);
    const hueco = (primero.getDay() + 6) % 7;
    const dias = new Date(estado.anio, estado.mes, 0).getDate();
    const out: (string | null)[] = Array(hueco).fill(null);
    for (let d = 1; d <= dias; d++) out.push(iso(new Date(estado.anio, estado.mes - 1, d)));
    return out;
  });

  function campanasDeMes(m: number) {
    return estado.campanas.filter((c) => c.mes === m);
  }

  function colorCampana(c: Campana): string {
    return estado.objetivo(c.objetivoId)?.color ?? 'var(--fg-muted)';
  }

  async function abrirDia(f: string) {
    await estado.irA(f);
    router.ir('hoy');
  }

  const hoy = hoyISO();
</script>

<Vista titulo="Mapa" sub="De los objetivos del año al día concreto">
  <div class="segmentos" role="group" aria-label="Horizonte">
    <button type="button" class:sel={modo === 'mes'} aria-pressed={modo === 'mes'} onclick={() => (modo = 'mes')}>
      Mes
    </button>
    <button type="button" class:sel={modo === 'anio'} aria-pressed={modo === 'anio'} onclick={() => (modo = 'anio')}>
      Año
    </button>
  </div>

  {#if modo === 'mes'}
    <div class="nav">
      <button
        type="button"
        aria-label="Mes anterior"
        onclick={() => estado.irAMes(estado.mes === 1 ? estado.anio - 1 : estado.anio, estado.mes === 1 ? 12 : estado.mes - 1)}
      >‹</button>
      <span class="rotulo">{MESES[estado.mes - 1]} <span class="tabular anio">{estado.anio}</span></span>
      <button
        type="button"
        aria-label="Mes siguiente"
        onclick={() => estado.irAMes(estado.mes === 12 ? estado.anio + 1 : estado.anio, estado.mes === 12 ? 1 : estado.mes + 1)}
      >›</button>
    </div>

    <h2>Campañas del mes</h2>
    {#if campanasMes.length === 0}
      <p class="vacio">Sin campañas. Una campaña es el tema que ordena el mes: una serie, un lanzamiento, un reto.</p>
    {:else}
      <ul class="metas">
        {#each campanasMes as c (c.id)}
          <li>
            <button type="button" style="--c:{colorCampana(c)}" onclick={() => (hoja = { tipo: 'campana', valor: c })}>
              <span class="punto"></span>
              <span class="txt">
                <span class="tit">{c.titulo}</span>
                {#if estado.objetivo(c.objetivoId)}
                  <span class="sub">{estado.objetivo(c.objetivoId)?.titulo}</span>
                {/if}
              </span>
              {#if c.meta}
                <span class="cifra tabular">{c.progreso ?? 0}/{c.meta}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <button class="anadir" type="button" onclick={() => (hoja = { tipo: 'campana', valor: null })}>
      + Añadir campaña
    </button>

    <h2>Días</h2>
    <div class="semanas" aria-hidden="true">
      {#each ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as d, i (i)}<span>{d}</span>{/each}
    </div>
    <div class="rejilla-mes">
      {#each celdas as f, i (i)}
        {#if f === null}
          <span class="hueco"></span>
        {:else}
          {@const min = carga.get(f) ?? 0}
          <button
            type="button"
            class="dia"
            class:hoy={f === hoy}
            style="--i:{Math.min(min / cargaMaxima, 1)}"
            onclick={() => abrirDia(f)}
            aria-label="{desdeISO(f).getDate()}, {min ? duracionLegible(min) + ' planificados' : 'libre'}"
          >
            <span class="num tabular">{desdeISO(f).getDate()}</span>
            {#if min}<span class="carga"></span>{/if}
          </button>
        {/if}
      {/each}
    </div>
    <p class="leyenda">Cuanto más lleno el día, más minutos planificados. El vacío también es información.</p>
  {:else}
    <div class="nav">
      <button type="button" aria-label="Año anterior" onclick={() => estado.irAMes(estado.anio - 1, estado.mes)}>‹</button>
      <span class="rotulo tabular">{estado.anio}</span>
      <button type="button" aria-label="Año siguiente" onclick={() => estado.irAMes(estado.anio + 1, estado.mes)}>›</button>
    </div>

    <h2>Objetivos del año</h2>
    {#if estado.objetivos.length === 0}
      <p class="vacio">Sin objetivos. Marca 1 a 5 como mucho: son el hilo de color que baja hasta cada bloque.</p>
    {:else}
      <ul class="metas">
        {#each estado.objetivos as o (o.id)}
          <li>
            <button type="button" style="--c:{o.color}" onclick={() => (hoja = { tipo: 'objetivo', valor: o })}>
              <span class="punto"></span>
              <span class="txt">
                <span class="tit">{o.titulo}</span>
                {#if o.meta}
                  <span class="barra"><span style="width:{Math.min(100, ((o.progreso ?? 0) / o.meta) * 100)}%"></span></span>
                {/if}
              </span>
              {#if o.meta}
                <span class="cifra tabular">{o.progreso ?? 0}/{o.meta}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <button class="anadir" type="button" onclick={() => (hoja = { tipo: 'objetivo', valor: null })}>
      + Añadir objetivo
    </button>

    <h2>Meses</h2>
    <div class="rejilla-anio">
      {#each MESES_CORTOS as nombre, i (nombre)}
        {@const cs = campanasDeMes(i + 1)}
        <button
          type="button"
          class="mes"
          class:actual={estado.mes === i + 1}
          onclick={() => {
            estado.irAMes(estado.anio, i + 1);
            modo = 'mes';
          }}
        >
          <span class="nombre">{nombre}</span>
          {#if cs.length}
            <span class="puntos">
              {#each cs.slice(0, 4) as c (c.id)}
                <span class="mini" style="--c:{colorCampana(c)}"></span>
              {/each}
            </span>
          {:else}
            <span class="sin">—</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</Vista>

{#if hoja}
  <MetaHoja tipo={hoja.tipo} valor={hoja.valor} onCerrar={() => (hoja = null)} />
{/if}

<style>
  .segmentos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  .segmentos button {
    min-height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    font-weight: 500;
  }

  .segmentos .sel {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 20%, var(--surface));
    font-weight: 600;
  }

  .nav {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
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

  .rotulo {
    text-align: center;
    font-weight: 600;
    text-transform: capitalize;
  }

  .anio {
    color: var(--fg-muted);
    font-weight: 500;
  }

  h2 {
    font-size: var(--fs-md);
    margin: var(--sp-5) 0 var(--sp-2);
  }

  .vacio {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .metas {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  .metas button {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 56px;
    padding: var(--sp-3);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: left;
  }

  .punto {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--c);
  }

  .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tit {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sub {
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .barra {
    display: block;
    height: 5px;
    border-radius: 3px;
    background: var(--surface-2);
    overflow: hidden;
  }

  .barra span {
    display: block;
    height: 100%;
    background: var(--c);
  }

  .cifra {
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .anadir {
    width: 100%;
    min-height: 48px;
    margin-top: var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px dashed var(--border);
    color: var(--fg-muted);
    font-weight: 500;
  }

  .semanas {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--sp-1);
    margin-bottom: var(--sp-1);
    text-align: center;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .rejilla-mes {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--sp-1);
  }

  .hueco {
    aspect-ratio: 1;
  }

  .dia {
    position: relative;
    aspect-ratio: 1;
    min-height: 44px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    /* la intensidad dice cuánto hay planificado sin necesidad de leer */
    background: color-mix(in srgb, var(--primary) calc(var(--i) * 55%), var(--surface));
    font-size: var(--fs-sm);
  }

  .dia.hoy {
    border-color: var(--primary);
    font-weight: 700;
  }

  .carga {
    position: absolute;
    bottom: 4px;
    width: 14px;
    height: 3px;
    border-radius: 2px;
    background: var(--primary);
  }

  .leyenda {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .rejilla-anio {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
  }

  .mes {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    min-height: 72px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
  }

  .mes.actual {
    border-color: var(--primary);
  }

  .nombre {
    font-weight: 600;
  }

  .puntos {
    display: flex;
    gap: 3px;
  }

  .mini {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--c);
  }

  .sin {
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }
</style>
