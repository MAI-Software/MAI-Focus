<script lang="ts">
  /** Hoja inferior. Siempre con salida visible: scrim, botón cerrar y Escape. */
  import type { Snippet } from 'svelte';

  let {
    titulo,
    onCerrar,
    children
  }: { titulo: string; onCerrar: () => void; children: Snippet } = $props();

  function tecla(e: KeyboardEvent) {
    if (e.key === 'Escape') onCerrar();
  }
</script>

<svelte:window onkeydown={tecla} />

<div class="scrim" role="presentation" onclick={onCerrar}></div>

<div class="hoja" role="dialog" aria-modal="true" aria-label={titulo}>
  <header>
    <span class="tirador" aria-hidden="true"></span>
    <div class="fila">
      <h2>{titulo}</h2>
      <button class="cerrar" type="button" onclick={onCerrar} aria-label="Cerrar">Cerrar</button>
    </div>
  </header>
  <div class="cuerpo">
    {@render children()}
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: var(--z-sheet);
    background: rgba(2, 6, 23, 0.55);
    animation: aparecer var(--dur-in) var(--ease-out);
  }

  .hoja {
    position: fixed;
    inset: auto 0 0 0;
    z-index: calc(var(--z-sheet) + 1);
    max-height: 88dvh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    border-top: 1px solid var(--border);
    animation: subir var(--dur-in) var(--ease-out);
  }

  header {
    padding: var(--sp-2) var(--sp-4) 0;
  }

  .tirador {
    display: block;
    width: 40px;
    height: 4px;
    margin: 0 auto var(--sp-3);
    border-radius: 2px;
    background: var(--border);
  }

  .fila {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
  }

  h2 {
    font-size: var(--fs-lg);
  }

  .cerrar {
    min-height: 44px;
    padding: 0 var(--sp-2);
    color: var(--fg-muted);
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .cuerpo {
    overflow-y: auto;
    padding: var(--sp-4) var(--sp-4) calc(var(--sp-5) + env(safe-area-inset-bottom, 0px));
  }

  @keyframes subir {
    from {
      transform: translateY(16px);
      opacity: 0;
    }
  }

  @keyframes aparecer {
    from {
      opacity: 0;
    }
  }
</style>
