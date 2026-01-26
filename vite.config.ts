import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-nojekyll",
      apply: "build",
      writeBundle() {
        const nojekyllPath = path.join(__dirname, ".nojekyll");
        const distPath = path.join(__dirname, "dist", ".nojekyll");
        if (fs.existsSync(nojekyllPath)) {
          fs.copyFileSync(nojekyllPath, distPath);
        }
      },
    },
  ],
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
