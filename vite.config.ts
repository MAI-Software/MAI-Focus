import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // rutas relativas: la app funciona igual en la raíz de Pages,
  // en una preview con subruta o dentro del WebView de la APK
  base: './',
  plugins: [svelte()],
})
