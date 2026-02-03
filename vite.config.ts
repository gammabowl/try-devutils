
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  // Ensure SPA routing works - Vite serves index.html for all routes by default
  appType: 'spa',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      includeAssets: ['favicon.ico', 'favicon.png', 'og_trydevutils.png'],
      manifest: {
        name: 'TryDevUtils',
        short_name: 'TryDevUtils',
        description: 'Essential Developer Utilities',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['developer', 'productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr'
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        toplevel: true,
        safari10: true,
      },
      format: {
        comments: false, // Remove all comments including license comments
      },
    },
    sourcemap: false,
    cssMinify: true, // Minify CSS
    cssCodeSplit: true, // Split CSS per chunk
    modulePreload: {
      polyfill: false, // Most modern browsers support modulepreload
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor": [
            "react",
            "react-dom",
            "react-router-dom",
          ],
          "ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-dropdown-menu",
          ],
          "utils": [
            "date-fns",
            "cronstrue",
            "diff",
            "js-yaml",
            "uuid",
          ],
        },
      },
      onwarn(warning, warn) {
        // Suppress "Module externalized for browser compatibility" warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            (warning.message && warning.message.includes('externalized for browser compatibility'))) {
          return;
        }
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
