<script lang="ts">
  /** Contenedor de vista: cabecera + zona scroll con hueco para la barra inferior. */
  import type { Snippet } from 'svelte';

  let {
    titulo,
    sub,
    children
  }: { titulo: string; sub?: string; children?: Snippet } = $props();
</script>

<section class="vista">
  <header class="cab">
    <h1>{titulo}</h1>
    {#if sub}<p class="sub">{sub}</p>{/if}
  </header>
  <div class="cuerpo">
    {@render children?.()}
  </div>
</section>

<style>
  .vista {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .cab {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: calc(env(safe-area-inset-top, 0px) + var(--sp-4)) var(--sp-4) var(--sp-3);
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  h1 {
    font-size: var(--fs-xl);
  }

  .sub {
    margin: var(--sp-1) 0 0;
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .cuerpo {
    flex: 1;
    padding: var(--sp-4);
    /* el contenido nunca queda debajo de la barra fija */
    padding-bottom: calc(var(--nav-h) + var(--sp-5));
  }
</style>
