
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
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
            "jsonwebtoken",
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
