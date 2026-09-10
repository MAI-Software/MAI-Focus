<script lang="ts">
  import Vista from '../lib/Vista.svelte';
  import { estado } from '../lib/estado.svelte';
  import { router } from '../lib/router.svelte';
  import { diaCorto, duracionLegible, hoyISO, numeroDia, semanaDe, sumarDias } from '../lib/tiempo';

  const dias = $derived(semanaDe(estado.fecha));

  function totalDe(fecha: string): number {
    return estado
      .bloquesDeFecha(fecha)
      .filter((b) => b.estado !== 'hecho')
      .reduce((s, b) => s + b.duracionMin, 0);
  }

  function hechosDe(fecha: string): number {
    return estado.bloquesDeFecha(fecha).filter((b) => b.estado === 'hecho').length;
  }

  async function abrirDia(fecha: string) {
    await estado.irA(fecha);
    router.ir('hoy');
  }

  const inicio = $derived(estado.ajustes.diaInicioMin);
  const largo = $derived(estado.ajustes.diaFinMin - estado.ajustes.diaInicioMin);
</script>

<Vista titulo="Semana" sub="Toca un día para trabajarlo">
  <div class="nav">
    <button type="button" onclick={() => estado.irA(sumarDias(estado.fecha, -7))} aria-label="Semana anterior">‹</button>
    <button type="button" class="volver" onclick={() => estado.irA(hoyISO())}>Semana de hoy</button>
    <button type="button" onclick={() => estado.irA(sumarDias(estado.fecha, 7))} aria-label="Semana siguiente">›</button>
  </div>

  <ul class="lista">
    {#each dias as d (d)}
      {@const bloques = estado.bloquesDeFecha(d)}
      {@const total = totalDe(d)}
      {@const hechos = hechosDe(d)}
      <li>
        <button type="button" class="dia" class:hoy={d === hoyISO()} onclick={() => abrirDia(d)}>
          <div class="cab">
            <span class="nombre">{diaCorto(d)} <span class="num tabular">{numeroDia(d)}</span></span>
            <span class="meta tabular">
              {#if bloques.length === 0}
                libre
              {:else}
                {duracionLegible(total)}{#if hechos}· {hechos} hecho{hechos > 1 ? 's' : ''}{/if}
              {/if}
            </span>
          </div>
          <div class="pista" aria-hidden="true">
            {#each bloques as b (b.id)}
              <span
                class="marca"
                class:hecho={b.estado === 'hecho'}
                style="left:{((b.inicioMin - inicio) / largo) * 100}%; width:{Math.max((b.duracionMin / largo) * 100, 1.5)}%; --c:{b.color}"
              ></span>
            {/each}
          </div>
        </button>
      </li>
    {/each}
  </ul>

  <p class="nota">Arrastrar bloques entre días llega en la siguiente entrega. Por ahora, abre el bloque y usa «Mover a mañana».</p>
</Vista>

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
    width: 100%;
    padding: var(--sp-3);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: left;
  }

  .dia:active {
    transform: scale(0.99);
  }

  .hoy {
    border-color: var(--primary);
  }

  .cab {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    margin-bottom: var(--sp-2);
  }

  .nombre {
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

  .pista {
    position: relative;
    height: 10px;
    border-radius: 5px;
    background: var(--surface-2);
    overflow: hidden;
  }

  .marca {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 3px;
    background: var(--c);
  }

  .marca.hecho {
    background: var(--success);
  }

  .nota {
    margin: var(--sp-5) 0 0;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }
</style>
