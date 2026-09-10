<script lang="ts">
  import BottomNav from './lib/BottomNav.svelte';
  import Vista from './lib/Vista.svelte';
  import Vacio from './lib/Vacio.svelte';
  import Hoy from './views/Hoy.svelte';
  import Semana from './views/Semana.svelte';
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
    <Vista titulo="Mapa" sub="Mes y año: campañas y objetivos">
      <Vacio texto="Los objetivos de mes y año llegan en la siguiente fase." />
    </Vista>
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
