<script lang="ts">
  /** Alta/edición de un objetivo anual o de una campaña mensual. */
  import Hoja from './Hoja.svelte';
  import { estado } from './estado.svelte';
  import type { Campana, Objetivo } from './tipos';
  import { COLORES_CAT, MESES } from './tipos';

  let {
    tipo,
    valor,
    onCerrar
  }: {
    tipo: 'objetivo' | 'campana';
    valor: Objetivo | Campana | null;
    onCerrar: () => void;
  } = $props();

  const editando = $derived(valor !== null);
  const esObjetivo = $derived(tipo === 'objetivo');

  // svelte-ignore state_referenced_locally
  let titulo = $state(valor?.titulo ?? '');
  // svelte-ignore state_referenced_locally
  let color = $state((valor as Objetivo | null)?.color ?? COLORES_CAT[estado.objetivos.length % COLORES_CAT.length]);
  // svelte-ignore state_referenced_locally
  let objetivoId = $state((valor as Campana | null)?.objetivoId ?? '');
  // svelte-ignore state_referenced_locally
  let meta = $state<string | number>(valor?.meta ?? '');
  // svelte-ignore state_referenced_locally
  let progreso = $state<string | number>(valor?.progreso ?? '');
  let confirmando = $state(false);

  async function guardar() {
    const t = titulo.trim();
    if (!t) return;
    // el input numérico devuelve number, el de texto string: se acepta lo que venga
    const num = (v: string | number) => {
      if (v === '' || v == null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    if (esObjetivo) {
      await estado.guardarObjetivo({
        id: valor?.id,
        titulo: t,
        color,
        meta: num(meta),
        progreso: num(progreso) ?? 0
      });
    } else {
      await estado.guardarCampana({
        id: valor?.id,
        titulo: t,
        objetivoId: objetivoId || undefined,
        meta: num(meta),
        progreso: num(progreso) ?? 0
      });
    }
    onCerrar();
  }

  async function borrar() {
    if (!valor) return;
    if (esObjetivo) await estado.borrarObjetivo(valor.id);
    else await estado.borrarCampana(valor.id);
    onCerrar();
  }
</script>

<Hoja
  titulo={esObjetivo
    ? editando
      ? 'Objetivo del año'
      : `Nuevo objetivo ${estado.anio}`
    : editando
      ? 'Campaña del mes'
      : `Nueva campaña · ${MESES[estado.mes - 1]}`}
  {onCerrar}
>
  <div class="campo">
    <label for="m-titulo">Título</label>
    <input
      id="m-titulo"
      bind:value={titulo}
      placeholder={esObjetivo ? '10k seguidores en Instagram' : 'Serie de reels de cocina'}
      autocomplete="off"
    />
  </div>

  {#if esObjetivo}
    <div class="campo">
      <span class="etq">Color</span>
      <p class="ayuda">Todo lo que cuelgue de este objetivo se pinta de este color, del año al bloque de 5 minutos.</p>
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
  {:else}
    <div class="campo">
      <label for="m-obj">Objetivo del año</label>
      <select id="m-obj" bind:value={objetivoId}>
        <option value="">Sin objetivo</option>
        {#each estado.objetivos as o (o.id)}
          <option value={o.id}>{o.titulo}</option>
        {/each}
      </select>
    </div>
  {/if}

  <div class="dos">
    <div class="campo">
      <label for="m-progreso">Llevas</label>
      <input id="m-progreso" type="number" inputmode="numeric" bind:value={progreso} placeholder="0" />
    </div>
    <div class="campo">
      <label for="m-meta">Meta</label>
      <input id="m-meta" type="number" inputmode="numeric" bind:value={meta} placeholder="12" />
    </div>
  </div>

  <button class="principal" type="button" onclick={guardar} disabled={!titulo.trim()}>
    {editando ? 'Guardar' : 'Crear'}
  </button>

  {#if editando}
    <div class="zona-riesgo">
      {#if confirmando}
        <p class="aviso">
          {esObjetivo
            ? 'Se borra el objetivo. Los bloques que colgaban de él se quedan, con su color actual.'
            : 'Se borra la campaña. Los bloques del mes no se tocan.'}
        </p>
        <div class="dos">
          <button type="button" class="sec" onclick={() => (confirmando = false)}>Cancelar</button>
          <button type="button" class="borrar" onclick={borrar}>Sí, borrar</button>
        </div>
      {:else}
        <button type="button" class="borrar-txt" onclick={() => (confirmando = true)}>
          Borrar {esObjetivo ? 'objetivo' : 'campaña'}
        </button>
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

  .ayuda {
    margin: 0;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  input,
  select {
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

  .dos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }

  .principal {
    width: 100%;
    min-height: 52px;
    margin-top: var(--sp-2);
    border-radius: var(--radius);
    background: var(--primary-accion);
    color: var(--on-primary);
    font-weight: 600;
  }

  .principal:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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
