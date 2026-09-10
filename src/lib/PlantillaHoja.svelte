<script lang="ts">
  /** Crear o editar una plantilla: el botón de un toque al planificar. */
  import Hoja from './Hoja.svelte';
  import { estado } from './estado.svelte';
  import type { Energia, Plantilla } from './tipos';
  import { COLORES_CAT, MIN_BLOQUE } from './tipos';
  import { duracionLegible, limitar } from './tiempo';

  let { plantilla, onCerrar }: { plantilla: Plantilla | null; onCerrar: () => void } = $props();

  const editando = $derived(plantilla !== null);

  // svelte-ignore state_referenced_locally
  let nombre = $state(plantilla?.nombre ?? '');
  // svelte-ignore state_referenced_locally
  let color = $state(plantilla?.color ?? COLORES_CAT[estado.plantillas.length % COLORES_CAT.length]);
  // svelte-ignore state_referenced_locally
  let duracionMin = $state(plantilla?.duracionMin ?? 30);
  // svelte-ignore state_referenced_locally
  let energia = $state<Energia>(plantilla?.energia ?? 'media');
  let confirmando = $state(false);

  const ENERGIAS: { v: Energia; t: string }[] = [
    { v: 'baja', t: 'Baja' },
    { v: 'media', t: 'Media' },
    { v: 'alta', t: 'Alta' }
  ];

  async function guardar() {
    const n = nombre.trim();
    if (!n) return;
    await estado.guardarPlantilla({
      id: plantilla?.id,
      nombre: n,
      color,
      duracionMin,
      energia,
      fabrica: plantilla?.fabrica
    });
    onCerrar();
  }
</script>

<Hoja titulo={editando ? 'Plantilla' : 'Nueva plantilla'} {onCerrar}>
  <div class="campo">
    <label for="p-nombre">Nombre</label>
    <input id="p-nombre" bind:value={nombre} placeholder="Responder comentarios" autocomplete="off" />
  </div>

  <div class="campo">
    <span class="etq">Color</span>
    <div class="colores">
      {#each COLORES_CAT as c (c)}
        <button
          type="button"
          class="color"
          class:sel={color === c}
          style="--c:{c}"
          aria-label="Color {c}"
          aria-pressed={color === c}
          onclick={() => (color = c)}
        ></button>
      {/each}
    </div>
  </div>

  <div class="campo">
    <span class="etq">Duración por defecto</span>
    <div class="stepper">
      <button
        type="button"
        onclick={() => (duracionMin = limitar(duracionMin - estado.tramo, MIN_BLOQUE, 480))}
        aria-label="Menos {estado.tramo} minutos">−</button
      >
      <span class="valor tabular">{duracionLegible(duracionMin)}</span>
      <button
        type="button"
        onclick={() => (duracionMin = limitar(duracionMin + estado.tramo, MIN_BLOQUE, 480))}
        aria-label="Más {estado.tramo} minutos">+</button
      >
    </div>
  </div>

  <div class="campo">
    <span class="etq">Energía que pide</span>
    <div class="segmentos">
      {#each ENERGIAS as e (e.v)}
        <button type="button" class:sel={energia === e.v} aria-pressed={energia === e.v} onclick={() => (energia = e.v)}>
          {e.t}
        </button>
      {/each}
    </div>
  </div>

  <button class="principal" type="button" onclick={guardar} disabled={!nombre.trim()}>
    {editando ? 'Guardar' : 'Crear plantilla'}
  </button>

  {#if editando && plantilla}
    <div class="zona-riesgo">
      {#if confirmando}
        <p class="aviso">Se borra la plantilla. Los bloques ya creados con ella no se tocan.</p>
        <div class="dos">
          <button type="button" class="sec" onclick={() => (confirmando = false)}>Cancelar</button>
          <button
            type="button"
            class="borrar"
            onclick={async () => {
              await estado.borrarPlantilla(plantilla.id);
              onCerrar();
            }}>Sí, borrar</button
          >
        </div>
      {:else}
        <button type="button" class="borrar-txt" onclick={() => (confirmando = true)}>Borrar plantilla</button>
      {/if}
    </div>
  {/if}
</Hoja>

<style>
  .campo {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  label,
  .etq {
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--fg-muted);
  }

  input {
    min-height: 48px;
    padding: 0 var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg);
    font: inherit;
    font-size: var(--fs-md);
  }

  .colores {
    display: flex;
    gap: var(--sp-2);
    flex-wrap: wrap;
  }

  .color {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--c);
    border: 3px solid transparent;
  }

  .color.sel {
    border-color: var(--fg);
  }

  .stepper {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
    min-height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
  }

  .stepper button {
    height: 46px;
    font-size: var(--fs-lg);
    font-weight: 600;
  }

  .valor {
    text-align: center;
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  .segmentos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
  }

  .segmentos button {
    min-height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-weight: 500;
  }

  .segmentos .sel {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 20%, var(--surface-2));
    font-weight: 600;
  }

  .principal {
    width: 100%;
    min-height: 52px;
    border-radius: var(--radius);
    background: var(--primary);
    color: var(--on-primary);
    font-weight: 600;
  }

  .principal:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .dos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }

  .zona-riesgo {
    margin-top: var(--sp-5);
    padding-top: var(--sp-4);
    border-top: 1px solid var(--border);
  }

  .aviso {
    margin: 0 0 var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .sec {
    min-height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-weight: 500;
  }

  .borrar-txt {
    min-height: 44px;
    color: var(--destructive);
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .borrar {
    min-height: 48px;
    border-radius: var(--radius-sm);
    background: var(--destructive);
    color: #fff;
    font-weight: 600;
  }
</style>
