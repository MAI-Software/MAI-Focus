<script lang="ts">
  import Vista from '../lib/Vista.svelte';
  import PlantillaHoja from '../lib/PlantillaHoja.svelte';
  import { estado } from '../lib/estado.svelte';
  import type { Plantilla, Tramo } from '../lib/tipos';
  import { hhmm } from '../lib/tiempo';

  const TRAMOS: Tramo[] = [5, 10, 15, 30];
  const HORAS = Array.from({ length: 13 }, (_, i) => i + 4); // 04:00 a 16:00 como inicio posible

  let hoja = $state<{ plantilla: Plantilla | null } | null>(null);
</script>

<Vista titulo="Ideas y ajustes" sub="El banco de ideas llega en la próxima fase">
  <section>
    <h2>Tramo de la rejilla</h2>
    <p class="ayuda">Define el salto al arrastrar y el zoom del día. El mínimo del sistema son 5 minutos.</p>
    <div class="segmentos" role="group" aria-label="Tramo en minutos">
      {#each TRAMOS as t (t)}
        <button
          type="button"
          class:sel={estado.ajustes.tramoMin === t}
          aria-pressed={estado.ajustes.tramoMin === t}
          onclick={() => estado.setAjustes({ tramoMin: t })}
        >
          {t} min
        </button>
      {/each}
    </div>
  </section>

  <section>
    <h2>Horario visible</h2>
    <p class="ayuda">Lo que queda fuera no se dibuja: menos ruido, menos que mirar.</p>
    <div class="dos">
      <label>
        <span>Empieza</span>
        <select
          value={estado.ajustes.diaInicioMin}
          onchange={(e) => estado.setAjustes({ diaInicioMin: Number(e.currentTarget.value) })}
        >
          {#each HORAS as h (h)}
            <option value={h * 60}>{hhmm(h * 60)}</option>
          {/each}
        </select>
      </label>
      <label>
        <span>Termina</span>
        <select
          value={estado.ajustes.diaFinMin}
          onchange={(e) => estado.setAjustes({ diaFinMin: Number(e.currentTarget.value) })}
        >
          {#each [18, 20, 22, 23, 24] as h (h)}
            <option value={h * 60}>{hhmm(h * 60 === 1440 ? 1439 : h * 60)}</option>
          {/each}
        </select>
      </label>
    </div>
  </section>

  <section>
    <h2>Modo Calma</h2>
    <p class="ayuda">Corta animaciones y estímulos cuando el día ya viene con demasiado ruido.</p>
    <button
      type="button"
      class="conmutador"
      class:activo={estado.ajustes.calma}
      role="switch"
      aria-checked={estado.ajustes.calma}
      onclick={() => estado.setAjustes({ calma: !estado.ajustes.calma })}
    >
      <span class="bola"></span>
      <span class="txt">{estado.ajustes.calma ? 'Activado' : 'Desactivado'}</span>
    </button>
  </section>

  <section>
    <h2>Plantillas</h2>
    <p class="ayuda">Botones de un toque al crear un bloque. Toca una para editarla.</p>
    <ul class="plantillas">
      {#each estado.plantillas as p (p.id)}
        <li>
          <button type="button" style="--c:{p.color}" onclick={() => (hoja = { plantilla: p })}>
            <span class="punto"></span>
            <span class="nombre">{p.nombre}</span>
            <span class="dur tabular">{p.duracionMin} min</span>
          </button>
        </li>
      {/each}
    </ul>
    <button class="anadir" type="button" onclick={() => (hoja = { plantilla: null })}>+ Nueva plantilla</button>
  </section>
</Vista>

{#if hoja}
  <PlantillaHoja plantilla={hoja.plantilla} onCerrar={() => (hoja = null)} />
{/if}

<style>
  section {
    margin-bottom: var(--sp-6);
  }

  h2 {
    font-size: var(--fs-md);
    margin-bottom: var(--sp-1);
  }

  .ayuda {
    margin: 0 0 var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .segmentos {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--sp-2);
  }

  .segmentos button {
    min-height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    font-weight: 500;
  }

  .segmentos .sel {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 20%, var(--surface));
    font-weight: 600;
  }

  .dos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  select {
    min-height: 48px;
    padding: 0 var(--sp-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg);
    font: inherit;
  }

  .conmutador {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 48px;
    padding: 0 var(--sp-3) 0 6px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
  }

  .bola {
    width: 36px;
    height: 20px;
    border-radius: 999px;
    background: var(--surface-2);
    position: relative;
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
    background: color-mix(in srgb, var(--primary) 45%, var(--surface-2));
  }

  .activo .bola::after {
    transform: translateX(16px);
    background: var(--primary);
  }

  .txt {
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .plantillas {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  .plantillas button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: left;
  }

  .anadir {
    width: 100%;
    min-height: 48px;
    margin-top: var(--sp-2);
    border-radius: var(--radius-sm);
    border: 1px dashed var(--border);
    color: var(--fg-muted);
    font-weight: 500;
  }

  .punto {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
  }

  .nombre {
    flex: 1;
    font-weight: 500;
  }

  .dur {
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }
</style>
