/**
 * Dictado con la API del navegador. Si no está disponible (Firefox, WebView sin
 * plugin), la hoja de voz sigue funcionando escribiendo la orden a mano.
 */

interface ResultadoVoz {
  isFinal: boolean;
  0: { transcript: string };
}
interface EventoVoz {
  resultIndex: number;
  results: { length: number; [i: number]: ResultadoVoz };
}
interface Reconocedor {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventoVoz) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function constructor(): (new () => Reconocedor) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, new () => Reconocedor>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ERRORES: Record<string, string> = {
  'not-allowed': 'El micrófono está bloqueado. Dale permiso en el navegador y vuelve a intentarlo.',
  'service-not-allowed': 'El micrófono está bloqueado por el sistema.',
  'no-speech': 'No he oído nada. Prueba otra vez, más cerca del micro.',
  'audio-capture': 'No encuentro ningún micrófono conectado.',
  network: 'El dictado necesita conexión. Escribe la orden a mano mientras tanto.'
};

export class Voz {
  soportado = !!constructor();
  escuchando = $state(false);
  parcial = $state('');
  error = $state<string | null>(null);

  #rec: Reconocedor | null = null;

  empezar(alTerminar: (texto: string) => void) {
    const C = constructor();
    if (!C) {
      this.error = 'Este navegador no dicta. Escribe la orden.';
      return;
    }
    this.error = null;
    this.parcial = '';

    const rec = new C();
    this.#rec = rec;
    rec.lang = 'es-ES';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let texto = '';
      for (let i = 0; i < e.results.length; i++) texto += e.results[i][0].transcript;
      this.parcial = texto;
      const ultimo = e.results[e.results.length - 1];
      if (ultimo?.isFinal) alTerminar(texto.trim());
    };
    rec.onerror = (e) => {
      this.error = ERRORES[e.error] ?? 'No he podido escuchar.';
      this.escuchando = false;
    };
    rec.onend = () => {
      this.escuchando = false;
    };

    try {
      rec.start();
      this.escuchando = true;
    } catch {
      this.escuchando = false;
    }
  }

  parar() {
    this.#rec?.stop();
    this.escuchando = false;
  }
}
