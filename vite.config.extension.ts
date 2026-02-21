import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isExtension = mode === "extension";

  return {
    plugins: [react()],
    build: {
      outDir: isExtension ? "dist-extension" : "dist",
      rollupOptions: isExtension
        ? {
            input: {
              popup: resolve(__dirname, "index.html"),
              background: resolve(__dirname, "extension/background.ts")
            },
            output: {
              entryFileNames: "[name].js"
            }
          }
        : undefined
    }
  };
});