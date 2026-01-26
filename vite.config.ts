import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment
  // For user pages (username.github.io), use '/'
  // For project pages (username.github.io/repo-name), use '/repo-name/'
  base: "/",
  build: {
    outDir: "dist",
    // Generate sourcemaps for debugging
    sourcemap: false,
  },
});
