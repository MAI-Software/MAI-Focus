<script lang="ts">
  /** Crear o editar un bloque. Mismo formulario para los dos casos: menos que aprender. */
  import Hoja from './Hoja.svelte';
  import { estado } from './estado.svelte';
  import type { Bloque, Plantilla } from './tipos';
  import { MIN_BLOQUE } from './tipos';
  import { duracionLegible, fechaLarga, hhmm, limitar, snap, sumarDias } from './tiempo';

  let { bloque, onCerrar }: { bloque: Bloque | null; onCerrar: () => void } = $props();

  const editando = $derived(bloque !== null);

  // el componente se crea de cero cada vez que se abre la hoja, así que el
  // estado del formulario parte del bloque y luego vive por su cuenta
  // svelte-ignore state_referenced_locally
  let titulo = $state(bloque?.titulo ?? '');
  // svelte-ignore state_referenced_locally
  let tipo = $state(bloque?.tipo ?? 'libre');
  // svelte-ignore state_referenced_locally
  let color = $state(bloque?.color ?? 'var(--cat-5)');
  // svelte-ignore state_referenced_locally
  let duracionMin = $state(bloque?.duracionMin ?? estado.tramo);
  // svelte-ignore state_referenced_locally
  let inicioMin = $state(bloque?.inicioMin ?? estado.huecoSugerido(bloque?.duracionMin ?? estado.tramo));
  // svelte-ignore state_referenced_locally
  let nota = $state(bloque?.nota ?? '');
  // svelte-ignore state_referenced_locally
  let objetivoId = $state(bloque?.objetivoId ?? '');
  // svelte-ignore state_referenced_locally
  let fijo = $state(bloque?.fijo ?? false);
  // svelte-ignore state_referenced_locally
  let fecha = $state(bloque?.fecha ?? estado.fecha);
  let confirmandoBorrado = $state(false);

  /** el objetivo manda sobre el color: el hilo del año llega hasta aquí */
  const colorEfectivo = $derived(estado.objetivo(objetivoId)?.color ?? color);
  const proximosDias = $derived(Array.from({ length: 14 }, (_, i) => sumarDias(estado.fecha, i - 1)));

  function aplicar(p: Plantilla) {
    tipo = p.id;
    color = p.color;
    if (!editando) {
      duracionMin = p.duracionMin;
      if (!titulo.trim()) titulo = p.nombre;
    }
  }

  function cambiarDuracion(delta: number) {
    duracionMin = limitar(
      duracionMin + delta,
      MIN_BLOQUE,
      estado.ajustes.diaFinMin - inicioMin
    );
  }

  function cambiarHora(valor: string) {
    const [h, m] = valor.split(':').map(Number);
    if (Number.isNaN(h)) return;
    inicioMin = limitar(
      snap(h * 60 + m, MIN_BLOQUE),
      estado.ajustes.diaInicioMin,
      estado.ajustes.diaFinMin - MIN_BLOQUE
    );
  }

  async function guardar() {
    const t = titulo.trim() || 'Bloque';
    if (editando && bloque) {
      await estado.actualizar(bloque.id, {
        titulo: t, tipo, color, duracionMin, inicioMin, nota, fecha,
        objetivoId: objetivoId || undefined, fijo
      });
    } else {
      await estado.crear({
        titulo: t, tipo, color, duracionMin, inicioMin, nota, fecha,
        objetivoId: objetivoId || undefined, fijo
      });
    }
    onCerrar();
  }
</script>

<Hoja titulo={editando ? 'Bloque' : 'Nuevo bloque'} {onCerrar}>
  <div class="campo">
    <label for="b-titulo">Título</label>
    <input id="b-titulo" bind:value={titulo} placeholder="Grabar reel de la serie X" autocomplete="off" />
  </div>

  <div class="campo">
    <span class="etq">Plantilla</span>
    <div class="chips">
      {#each estado.plantillas as p (p.id)}
        <button
          type="button"
          class="chip"
          class:sel={tipo === p.id}
          style="--c:{p.color}"
          onclick={() => aplicar(p)}
        >
          <span class="punto" aria-hidden="true"></span>
          {p.nombre}
        </button>
      {/each}
    </div>
  </div>

  <div class="dos">
    <div class="campo">
      <label for="b-hora">Empieza</label>
      <input
        id="b-hora"
        type="time"
        step="300"
        value={hhmm(inicioMin)}
        onchange={(e) => cambiarHora(e.currentTarget.value)}
      />
    </div>

    <div class="campo">
      <span class="etq">Dura</span>
      <div class="stepper">
        <button type="button" onclick={() => cambiarDuracion(-estado.tramo)} aria-label="Menos {estado.tramo} minutos">−</button>
        <span class="valor tabular">{duracionLegible(duracionMin)}</span>
        <button type="button" onclick={() => cambiarDuracion(estado.tramo)} aria-label="Más {estado.tramo} minutos">+</button>
      </div>
    </div>
  </div>

  <p class="pista tabular">{hhmm(inicioMin)} → {hhmm(inicioMin + duracionMin)}</p>

  <div class="campo">
    <label for="b-objetivo">Objetivo del año</label>
    <select id="b-objetivo" bind:value={objetivoId}>
      <option value="">Sin objetivo</option>
      {#each estado.objetivos as o (o.id)}
        <option value={o.id}>{o.titulo}</option>
      {/each}
    </select>
    {#if objetivoId}
      <p class="ayuda">
        <span class="muestra" style="--c:{colorEfectivo}"></span>
        Este bloque toma el color del objetivo.
      </p>
    {/if}
  </div>

  <div class="campo">
    <label for="b-fecha">Día</label>
    <select id="b-fecha" bind:value={fecha}>
      {#each proximosDias as d (d)}
        <option value={d}>{fechaLarga(d)}</option>
      {/each}
      {#if !proximosDias.includes(fecha)}
        <option value={fecha}>{fechaLarga(fecha)}</option>
      {/if}
    </select>
  </div>

  <button
    type="button"
    class="conmutador"
    class:activo={fijo}
    role="switch"
    aria-checked={fijo}
    onclick={() => (fijo = !fijo)}
  >
    <span class="bola"></span>
    <span class="etq-sw">Hora fija (directo, colaboración, lanzamiento)</span>
  </button>
  <p class="ayuda sep">Un bloque de hora fija no se arrastra sin querer: su hora se cambia aquí.</p>

  <div class="campo">
    <label for="b-nota">Anotaciones</label>
    <textarea id="b-nota" rows="2" bind:value={nota} placeholder="Guion listo, falta trípode"></textarea>
  </div>

  <button class="principal" type="button" onclick={guardar}>
    {editando ? 'Guardar' : 'Añadir bloque'}
  </button>

  {#if editando && bloque}
    <div class="secundarias">
      <button type="button" onclick={async () => { await estado.alternarHecho(bloque.id); onCerrar(); }}>
        {bloque.estado === 'hecho' ? 'Marcar pendiente' : 'Hecho'}
      </button>
      <button type="button" onclick={async () => { await estado.moverAManana(bloque.id); onCerrar(); }}>
        Mover a mañana
      </button>
    </div>

    <div class="zona-riesgo">
      {#if confirmandoBorrado}
        <p class="aviso">Se borrará este bloque. No se puede deshacer.</p>
        <div class="secundarias">
          <button type="button" onclick={() => (confirmandoBorrado = false)}>Cancelar</button>
          <button
            type="button"
            class="borrar"
            onclick={async () => { await estado.borrar(bloque.id); onCerrar(); }}
          >
            Sí, borrar
          </button>
        </div>
      {:else}
        <button type="button" class="borrar-txt" onclick={() => (confirmandoBorrado = true)}>Borrar bloque</button>
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

  input,
  textarea {
    min-height: 48px;
    padding: var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg);
    font: inherit;
    font-size: var(--fs-md);
  }

  textarea {
    resize: vertical;
  }

  input:focus-visible,
  textarea:focus-visible {
    border-color: var(--focus-ring);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: 0 var(--sp-3);
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .chip .punto {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
  }

  .chip.sel {
    border-color: var(--c);
    background: color-mix(in srgb, var(--c) 22%, var(--surface-2));
  }

  .dos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
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

  .ayuda {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font-size: var(--fs-xs);
    color: var(--fg-muted);
  }

  .ayuda.sep {
    margin: var(--sp-2) 0 var(--sp-4);
  }

  .muestra {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
  }

  select {
    min-height: 48px;
    padding: 0 var(--sp-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg);
    font: inherit;
    font-size: var(--fs-md);
  }

  .conmutador {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 48px;
    padding: 0 var(--sp-3) 0 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    text-align: left;
  }

  .bola {
    flex: none;
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 999px;
    background: var(--surface);
    transition: background var(--dur-in) var(--ease-out);
  }

  .bola::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--fg-muted);
    transition: transform var(--dur-in) var(--ease-out);
  }

  .activo .bola {
    background: color-mix(in srgb, var(--primary) 45%, var(--surface));
  }

  .activo .bola::after {
    transform: translateX(16px);
    background: var(--primary);
  }

  .etq-sw {
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .pista {
    margin: 0 0 var(--sp-4);
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .principal {
    width: 100%;
    min-height: 52px;
    border-radius: var(--radius);
    background: var(--primary);
    color: var(--on-primary);
    font-size: var(--fs-md);
    font-weight: 600;
  }

  .principal:active {
    transform: scale(0.98);
  }

  .secundarias {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
  }

  .secundarias button {
    min-height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    font-weight: 500;
  }

  /* lo destructivo, separado de lo cotidiano */
  .zona-riesgo {
    margin-top: var(--sp-5);
    padding-top: var(--sp-4);
    border-top: 1px solid var(--border);
  }

  .aviso {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .borrar-txt {
    min-height: 44px;
    color: var(--destructive);
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .borrar {
    background: var(--destructive) !important;
    border-color: var(--destructive) !important;
    color: #fff;
  }
</style>
