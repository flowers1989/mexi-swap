import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import path from "path";
import { defineConfig } from "vite";
const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    strictPort: false, // Will find next available port if 8080 is busy
    host: "0.0.0.0",
    allowedHosts: [
      "8080-ia39whbifhpzqo68hzgie-013578f3.us1.manus.computer",
      "localhost",
      "127.0.0.1",
      "169.254.0.21",
      ".manus.computer",
      "*",
    ],
    fs: {
      strict: false,
    },
  },
});
