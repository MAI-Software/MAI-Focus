<script lang="ts">
  import BottomNav from './lib/BottomNav.svelte';
  import Vista from './lib/Vista.svelte';
  import Vacio from './lib/Vacio.svelte';
  import { router } from './lib/router.svelte';

  const HOY = new Date();
  const fmtFecha = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
</script>

<main>
  {#if router.ruta === 'hoy'}
    <Vista titulo="Hoy" sub={fmtFecha.format(HOY)}>
      <Vacio texto="Aún no hay bloques para hoy." accion="Añadir bloque" />
    </Vista>
  {:else if router.ruta === 'semana'}
    <Vista titulo="Semana" sub="Reparte los bloques entre los días">
      <Vacio texto="La semana está vacía. Empieza por un día de grabación." accion="Planificar semana" />
    </Vista>
  {:else if router.ruta === 'mapa'}
    <Vista titulo="Mapa" sub="Mes y año: campañas y objetivos">
      <Vacio texto="Sin objetivos definidos todavía." accion="Crear objetivo" />
    </Vista>
  {:else}
    <Vista titulo="Ideas" sub="Banco de ideas, plantillas y ajustes">
      <Vacio texto="El banco de ideas está vacío." accion="Anotar idea" />
    </Vista>
  {/if}
</main>

<BottomNav />
