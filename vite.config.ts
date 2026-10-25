import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Solo la web publicada lleva CSP: el servidor de desarrollo inyecta scripts
// en línea (React Refresh) y la versión offline lo mete todo en un único HTML.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' data: https://generativelanguage.googleapis.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function cspEnBuild(): Plugin {
  return {
    name: 'ofiword-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      ),
  };
}

// En la versión offline el favicon también va incrustado (Vite no lo hace en <link>).
function faviconIncrustado(): Plugin {
  return {
    name: 'ofiword-favicon-incrustado',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(
          '/src/assets/icono.png',
          `data:image/png;base64,${readFileSync('src/assets/icono.png').toString('base64')}`,
        ),
    },
  };
}

// `vite build` genera la web para GitHub Pages en dist/.
// `vite build --mode offline` genera dist-offline/index.html con todo incrustado;
// scripts/copiar-offline.mjs lo copia a dist/ofiword-studio.html.
export default defineConfig(({ mode }) => {
  const offline = mode === 'offline';
  return {
    // Rutas relativas: funciona en https://<org>.github.io/OfiWordStudio/ y con file://
    base: './',
    plugins: [react(), tailwindcss(), ...(offline ? [faviconIncrustado(), viteSingleFile()] : [cspEnBuild()])],
    build: offline
      ? { outDir: 'dist-offline', emptyOutDir: true, assetsInlineLimit: () => true, chunkSizeWarningLimit: 4000 }
      : { outDir: 'dist', chunkSizeWarningLimit: 1500 },
  };
});
