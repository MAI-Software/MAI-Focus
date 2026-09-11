<script lang="ts">
  /**
   * Marca de categoría: forma + color. La forma es la que hace el trabajo cuando
   * el color no llega (daltonismo, sol en la pantalla, dos categorías parecidas).
   */
  import type { Forma } from './tipos';

  let {
    forma = 'circulo',
    color,
    size = 14
  }: { forma?: Forma; color: string; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={forma === 'anillo' ? 'none' : color}
  stroke={forma === 'anillo' ? color : 'none'}
  stroke-width="5"
  aria-hidden="true"
  focusable="false"
  style="flex:none"
>
  {#if forma === 'cuadrado'}
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
  {:else if forma === 'triangulo'}
    <path d="M12 3 21 20.5H3Z" />
  {:else if forma === 'rombo'}
    <path d="M12 2 22 12 12 22 2 12Z" />
  {:else if forma === 'hexagono'}
    <path d="M12 2.2 20.5 7.1v9.8L12 21.8 3.5 16.9V7.1Z" />
  {:else if forma === 'estrella'}
    <path d="M12 2.6l2.8 6.2 6.7.6-5.1 4.5 1.5 6.6L12 17.1l-5.9 3.4 1.5-6.6L2.5 9.4l6.7-.6Z" />
  {:else if forma === 'gota'}
    <path d="M12 2.2c4.6 5.7 7 8.9 7 12.3a7 7 0 0 1-14 0c0-3.4 2.4-6.6 7-12.3Z" />
  {:else if forma === 'anillo'}
    <circle cx="12" cy="12" r="8" />
  {:else if forma === 'barra'}
    <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
  {:else}
    <circle cx="12" cy="12" r="9.5" />
  {/if}
</svg>
