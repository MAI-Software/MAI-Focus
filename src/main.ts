import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const destino = document.getElementById('app')

// una pantalla en blanco no dice nada: si el arranque falla, que se vea
function fallo(e: unknown) {
  console.error('[MAI-Focus] fallo al arrancar', e)
  if (!destino) return
  destino.innerHTML =
    '<div style="padding:24px;font:16px/1.5 Inter,system-ui,sans-serif;color:#fff">' +
    '<h1 style="font-size:20px;margin:0 0 8px">No se pudo arrancar</h1>' +
    '<p style="color:#94a3b8;margin:0 0 12px">' +
    String((e as Error)?.message ?? e) +
    '</p><button onclick="location.reload()" style="min-height:48px;padding:0 20px;border:0;border-radius:12px;background:#ea580c;color:#fff;font-weight:600">Reintentar</button></div>'
}

window.addEventListener('error', (e) => fallo(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => fallo(e.reason))

let app: ReturnType<typeof mount> | undefined
try {
  app = mount(App, { target: destino! })
} catch (e) {
  fallo(e)
}

export default app
