/**
 * Router mínimo por hash. Cada vista tiene URL propia para deep-linking
 * (nav-pattern `deep-linking`) y para que el botón atrás del móvil funcione.
 */

export const RUTAS = ['hoy', 'semana', 'mapa', 'ideas'] as const;
export type Ruta = (typeof RUTAS)[number];

const RUTA_POR_DEFECTO: Ruta = 'hoy';

function leerHash(): Ruta {
  const h = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return (RUTAS as readonly string[]).includes(h) ? (h as Ruta) : RUTA_POR_DEFECTO;
}

class Router {
  ruta = $state<Ruta>(RUTA_POR_DEFECTO);

  constructor() {
    if (typeof window === 'undefined') return;
    this.ruta = leerHash();
    window.addEventListener('hashchange', () => {
      this.ruta = leerHash();
    });
  }

  ir(ruta: Ruta) {
    if (this.ruta === ruta) return;
    window.location.hash = `/${ruta}`;
  }
}

export const router = new Router();
