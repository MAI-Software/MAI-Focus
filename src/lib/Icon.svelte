<script lang="ts">
  /**
   * Iconos de línea (familia Lucide, stroke 1.75, caja 24).
   * PROVISIONAL: set final pendiente del branding.
   * Nunca usar emoji como icono estructural.
   */
  type Nombre = 'hoy' | 'semana' | 'mapa' | 'ideas';

  let { nombre, size = 24 }: { nombre: Nombre; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if nombre === 'hoy'}
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  {:else if nombre === 'semana'}
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M8 2v4M16 2v4M3 10h18" />
    <path d="M9 14v4M15 14v4" />
  {:else if nombre === 'mapa'}
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  {:else if nombre === 'ideas'}
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5A4.9 4.9 0 0 0 18 8a6 6 0 0 0-12 0c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6M10 22h4" />
  {/if}
</svg>
