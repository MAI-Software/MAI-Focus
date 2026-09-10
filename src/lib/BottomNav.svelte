<script lang="ts">
  import Icon from './Icon.svelte';
  import { router, RUTAS, type Ruta } from './router.svelte';

  const ETIQUETAS: Record<Ruta, string> = {
    hoy: 'Hoy',
    semana: 'Semana',
    mapa: 'Mapa',
    ideas: 'Ideas'
  };
</script>

<nav class="nav" aria-label="Navegación principal">
  {#each RUTAS as ruta (ruta)}
    {@const activa = router.ruta === ruta}
    <button
      class="item"
      class:activa
      aria-current={activa ? 'page' : undefined}
      onclick={() => router.ir(ruta)}
    >
      <span class="marca" aria-hidden="true"></span>
      <Icon nombre={ruta} />
      <span class="txt">{ETIQUETAS[ruta]}</span>
    </button>
  {/each}
</nav>

<style>
  .nav {
    position: fixed;
    inset: auto 0 0 0;
    z-index: var(--z-nav);
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--sp-1);
    height: var(--nav-h);
    padding: 0 var(--sp-2) env(safe-area-inset-bottom, 0px);
    background: var(--surface);
    border-top: 1px solid var(--border);
  }

  .item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 48px;
    padding: var(--sp-1);
    color: var(--fg-muted);
    transition: color var(--dur-in) var(--ease-out);
  }

  .item:active {
    transform: scale(0.96);
  }

  .activa {
    color: var(--primary);
  }

  /* estado activo no se apoya solo en color: también barra y peso */
  .marca {
    position: absolute;
    top: 0;
    width: 28px;
    height: 3px;
    border-radius: 0 0 3px 3px;
    background: transparent;
    transition: background var(--dur-in) var(--ease-out);
  }

  .activa .marca {
    background: var(--primary);
  }

  .txt {
    font-size: var(--fs-xs);
    font-weight: 500;
  }

  .activa .txt {
    font-weight: 600;
  }
</style>
