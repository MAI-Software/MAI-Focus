<script lang="ts">
  /** Elegir color y forma de una etiqueta. Los dos juntos: el color distingue, la forma confirma. */
  import Marca from './Marca.svelte';
  import type { Forma } from './tipos';
  import { COLORES_CAT, FORMAS, nombreColor, nombreForma } from './tipos';

  let {
    color = $bindable(),
    forma = $bindable(),
    ayuda
  }: { color: string; forma: Forma; ayuda?: string } = $props();
</script>

<div class="campo">
  <div class="fila">
    <span class="etq">Etiqueta</span>
    <span class="muestra">
      <Marca {forma} {color} size={18} />
      <span class="nombres">{nombreColor(color)} · {nombreForma(forma)}</span>
    </span>
  </div>
  {#if ayuda}<p class="ayuda">{ayuda}</p>{/if}

  <div class="rejilla colores" role="group" aria-label="Color de la etiqueta">
    {#each COLORES_CAT as c (c.valor)}
      <button
        type="button"
        class="pastilla"
        class:sel={color === c.valor}
        style="--c:{c.valor}"
        aria-label={c.nombre}
        aria-pressed={color === c.valor}
        onclick={() => (color = c.valor)}
      >
        <span class="tinta"></span>
      </button>
    {/each}
  </div>

  <div class="rejilla formas" role="group" aria-label="Forma de la etiqueta">
    {#each FORMAS as f (f.valor)}
      <button
        type="button"
        class="pastilla"
        class:sel={forma === f.valor}
        aria-label={f.nombre}
        aria-pressed={forma === f.valor}
        onclick={() => (forma = f.valor)}
      >
        <Marca forma={f.valor} {color} size={20} />
      </button>
    {/each}
  </div>
</div>

<style>
  .campo {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  .fila {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
  }

  .etq {
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--fg-muted);
  }

  .muestra {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .nombres {
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  .ayuda {
    margin: 0;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .rejilla {
    display: grid;
    gap: var(--sp-2);
  }

  .colores {
    grid-template-columns: repeat(6, 1fr);
  }

  .formas {
    grid-template-columns: repeat(6, 1fr);
    margin-top: var(--sp-1);
  }

  .pastilla {
    display: grid;
    place-items: center;
    min-height: 46px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
  }

  .pastilla.sel {
    border-color: var(--fg);
    background: color-mix(in srgb, var(--fg) 10%, var(--surface-2));
  }

  .tinta {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--c);
  }

  .colores .pastilla.sel .tinta {
    box-shadow: 0 0 0 3px var(--surface-2), 0 0 0 5px var(--c);
  }
</style>
