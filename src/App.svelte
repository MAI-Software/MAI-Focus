<script lang="ts">
  import BottomNav from './lib/BottomNav.svelte';
  import Hoy from './views/Hoy.svelte';
  import Semana from './views/Semana.svelte';
  import Mapa from './views/Mapa.svelte';
  import Ideas from './views/Ideas.svelte';
  import { router } from './lib/router.svelte';
  import { estado } from './lib/estado.svelte';

  estado.init();
</script>

<main>
  {#if !estado.listo}
    <div class="cargando" role="status" aria-live="polite">Cargando tu día…</div>
  {:else if router.ruta === 'hoy'}
    <Hoy />
  {:else if router.ruta === 'semana'}
    <Semana />
  {:else if router.ruta === 'mapa'}
    <Mapa />
  {:else}
    <Ideas />
  {/if}
</main>

<BottomNav />

<style>
  .cargando {
    display: grid;
    place-items: center;
    min-height: 100dvh;
    color: var(--fg-muted);
  }
</style>
