import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

function githubPagesHtmlCompatibility(): Plugin {
  return {
    name: "github-pages-html-compatibility",
    transformIndexHtml(html) {
      return html.replace(
        /\s*<script defer src="%VITE_ANALYTICS_ENDPOINT%\/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"><\/script>/,
        "",
      );
    },
  };
}

export default defineConfig({
  base: "/Web/",
  plugins: [react(), tailwindcss(), githubPagesHtmlCompatibility()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
