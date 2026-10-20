import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import pkg from './package.json' with { type: 'json' }

// El login con Google abre una ventana emergente que responde con postMessage; con la política
// por defecto del navegador esa respuesta se bloquea.
const headers = { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' }

const isWslWindowsDrive = !!process.env.WSL_DISTRO_NAME && process.cwd().startsWith('/mnt/')

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    host: true,
    // WSL sirviendo una unidad de Windows (/mnt/c/...) no recibe eventos de cambios: hay que sondear.
    watch: isWslWindowsDrive ? { usePolling: true, interval: 300 } : undefined,
    headers,
  },
  preview: { headers },
})
