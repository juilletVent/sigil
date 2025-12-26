import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // 确保只有一个 styled-components 实例
  resolve: {
    dedupe: ["styled-components"],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  // 优化配置，确保 styled-components 正确打包
  optimizeDeps: {
    include: ["styled-components"],
    esbuildOptions: {
      // 确保 styled-components 被正确处理
      target: "es2020",
    },
  },
  
  build: {
    // 确保 styled-components 被正确处理
    commonjsOptions: {
      include: [/styled-components/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
}));
