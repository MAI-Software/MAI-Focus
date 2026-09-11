<script lang="ts">
  /**
   * Orden por voz (o escrita) + modo razonamiento: antes de tocar nada, la app
   * enseña qué ha entendido paso a paso y espera confirmación.
   */
  import Hoja from './Hoja.svelte';
  import { estado } from './estado.svelte';
  import { Voz } from './voz.svelte';
  import { interpretar, EJEMPLOS, type Lectura } from './lenguaje';
  import type { Bloque } from './tipos';
  import { fechaLarga, hhmm, hoyISO } from './tiempo';

  let { onCerrar }: { onCerrar: () => void } = $props();

  const voz = new Voz();
  let texto = $state('');
  let lectura = $state<Lectura | null>(null);
  let hecho = $state<string | null>(null);

  function contexto() {
    const mapa = new Map<string, Bloque>();
    for (const b of [...estado.semana, ...estado.bloquesMes, ...estado.bloques]) mapa.set(b.id, b);
    // «hoy» y «mañana» son el día real, no el día que estés mirando en la app
    return { hoy: hoyISO(), bloques: [...mapa.values()], tramo: estado.tramo };
  }

  function leer(frase: string) {
    texto = frase;
    lectura = frase.trim() ? interpretar(frase, contexto()) : null;
  }

  function dictar() {
    if (voz.escuchando) {
      voz.parar();
      return;
    }
    hecho = null;
    voz.empezar((t) => leer(t));
  }

  function elegir(b: Bloque) {
    if (!lectura) return;
    // el usuario deshace la duda: se vuelve a interpretar con ese bloque fijado
    lectura = interpretar(texto, { ...contexto(), bloques: [b] });
  }

  async function aplicar() {
    if (!lectura?.aplicable) return;
    const resumen = await estado.aplicarLectura(lectura);
    hecho = resumen;
    lectura = null;
    texto = '';
  }

  const ICONO = {
    ok: 'M4 12.5l5 5L20 6.5',
    duda: 'M12 7v6M12 17h.01',
    falta: 'M6 6l12 12M18 6L6 18'
  } as const;
</script>

<Hoja titulo="Dime qué cambio" {onCerrar}>
  <div class="micro">
    <button
      type="button"
      class="boton"
      class:activo={voz.escuchando}
      onclick={dictar}
      disabled={!voz.soportado}
      aria-label={voz.escuchando ? 'Parar de escuchar' : 'Hablar'}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
        <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V21.5M8.5 21.5h7" />
      </svg>
    </button>
    <p class="pie">
      {#if voz.escuchando}
        Escuchando… suelta la frase entera.
      {:else if voz.soportado}
        Toca el micro y dilo, o escríbelo abajo.
      {:else}
        Este navegador no dicta: escribe la orden abajo.
      {/if}
    </p>
    {#if voz.parcial && voz.escuchando}
      <p class="parcial" aria-live="polite">{voz.parcial}</p>
    {/if}
    {#if voz.error}
      <p class="error" role="status">{voz.error}</p>
    {/if}
  </div>

  <div class="campo">
    <label for="v-texto">Orden</label>
    <textarea
      id="v-texto"
      rows="2"
      value={texto}
      oninput={(e) => leer(e.currentTarget.value)}
      placeholder="Cambia mi reunión de hoy de las 18:00 para mañana a las 16:00"
    ></textarea>
  </div>

  {#if !lectura && !hecho}
    <div class="ejemplos">
      <span class="etq">Ejemplos</span>
      {#each EJEMPLOS as e (e)}
        <button type="button" class="ejemplo" onclick={() => leer(e)}>{e}</button>
      {/each}
    </div>
  {/if}

  {#if hecho}
    <p class="listo" role="status" aria-live="polite">{hecho}</p>
  {/if}

  {#if lectura}
    <section class="razon" aria-label="Lo que he entendido">
      <h3>Lo que he entendido</h3>
      <ul>
        {#each lectura.pasos as p, i (i)}
          <li class={p.estado}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
              <path d={ICONO[p.estado]} />
            </svg>
            <span class="etq">{p.etiqueta}</span>
            <span class="val">{p.valor}</span>
          </li>
        {/each}
      </ul>

      {#if lectura.candidatos.length}
        <p class="duda">{lectura.problema}</p>
        <div class="candidatos">
          {#each lectura.candidatos as b (b.id)}
            <button type="button" onclick={() => elegir(b)}>
              {b.titulo} · {fechaLarga(b.fecha)} {hhmm(b.inicioMin)}
            </button>
          {/each}
        </div>
      {:else if lectura.problema}
        <p class="duda">{lectura.problema}</p>
      {/if}

      {#if lectura.conflictos.length}
        <p class="duda">
          Se solapará con {lectura.conflictos.length === 1 ? 'otro bloque' : `${lectura.conflictos.length} bloques`}.
          Puedes aplicarlo igual: se repartirán el ancho.
        </p>
      {/if}

      {#if lectura.aplicable}
        <button class="principal" type="button" onclick={aplicar}>Aplicar</button>
      {/if}
    </section>
  {/if}
</Hoja>

<style>
  .micro {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  .boton {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--primary-accion);
    color: var(--on-primary);
    transition: transform var(--dur-out) var(--ease-out);
  }

  .boton:disabled {
    background: var(--surface-2);
    color: var(--fg-muted);
  }

  .boton:active {
    transform: scale(0.95);
  }

  /* escuchando: el pulso dice que el micro está abierto sin depender del color */
  .activo {
    animation: pulso 1.4s ease-in-out infinite;
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary) 55%, transparent);
  }

  @keyframes pulso {
    50% {
      box-shadow: 0 0 0 14px transparent;
    }
  }

  .pie,
  .parcial,
  .error {
    margin: 0;
    text-align: center;
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .parcial {
    color: var(--fg);
    font-weight: 500;
  }

  .error {
    color: var(--warn);
  }

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

  textarea {
    padding: var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--fg);
    font: inherit;
    font-size: var(--fs-md);
    resize: vertical;
  }

  .ejemplos {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  .ejemplo {
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px dashed var(--border);
    background: var(--surface-2);
    font-size: var(--fs-sm);
    text-align: left;
    color: var(--fg-muted);
  }

  .razon {
    padding: var(--sp-3);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface-2);
  }

  h3 {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-sm);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--fg-muted);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  li {
    display: grid;
    grid-template-columns: 16px 84px 1fr;
    align-items: start;
    gap: var(--sp-2);
    font-size: var(--fs-sm);
  }

  li.ok {
    color: var(--success);
  }

  li.duda {
    color: var(--warn);
  }

  li.falta {
    color: var(--destructive);
  }

  li .etq,
  li .val {
    color: var(--fg);
  }

  li .etq {
    color: var(--fg-muted);
  }

  li .val {
    font-weight: 500;
  }

  .duda {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-sm);
    color: var(--fg-muted);
  }

  .candidatos {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }

  .candidatos button {
    min-height: 48px;
    padding: 0 var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: left;
    font-size: var(--fs-sm);
  }

  .principal {
    width: 100%;
    min-height: 52px;
    margin-top: var(--sp-4);
    border-radius: var(--radius);
    background: var(--primary-accion);
    color: var(--on-primary);
    font-weight: 600;
  }

  .listo {
    margin: 0 0 var(--sp-4);
    padding: var(--sp-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    border-left: 3px solid var(--success);
    background: var(--surface);
    font-size: var(--fs-sm);
  }
</style>
