<script lang="ts">
  /** Estado vacío: qué falta + qué hacer. Nunca una pantalla en blanco. */
  let { texto, accion }: { texto: string; accion?: string } = $props();
</script>

<div class="vacio">
  <p>{texto}</p>
  {#if accion}
    <button class="cta" type="button" disabled>{accion}</button>
    <p class="pendiente">Disponible en la siguiente fase</p>
  {/if}
</div>

<style>
  .vacio {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-7) var(--sp-4);
    text-align: center;
    color: var(--fg-muted);
  }

  .cta {
    min-height: 48px;
    padding: 0 var(--sp-5);
    border-radius: var(--radius);
    background: var(--primary-accion);
    color: var(--on-primary);
    font-weight: 600;
    transition: transform var(--dur-out) var(--ease-out);
  }

  .cta:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .cta:not(:disabled):active {
    transform: scale(0.97);
  }

  .pendiente {
    margin: 0;
    font-size: var(--fs-xs);
  }
</style>
