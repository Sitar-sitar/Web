import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

// GitHub Actions 上では GitHub Pages のサブパスを既定にする。
// CI は `vite build --base /Web/rubber/` で明示指定するため、CLI 指定が優先される。
const IS_GITHUB_PAGES = process.env.GITHUB_ACTIONS === "true";

// 本番 HTML にだけ CSP を付与する。dev サーバーは Vite が HMR 用の
// インラインスクリプトを注入するため、同じ CSP を適用すると起動できない。
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

function vitePluginProductionCsp(): Plugin {
  return {
    name: "rubber-index-production-csp",
    apply: "build",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: CONTENT_SECURITY_POLICY,
          },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  base: IS_GITHUB_PAGES ? "/Web/" : "/",
  plugins: [react(), tailwindcss(), vitePluginProductionCsp()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    // 既定の dev サーバーは loopback のみで待ち受ける。
    // LAN へ公開する必要があるときだけ `pnpm dev:lan`（vite --host）を使う。
    host: "127.0.0.1",
    port: 3000,
    strictPort: false,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
