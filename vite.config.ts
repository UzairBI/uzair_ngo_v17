import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Admin is now part of the Vite build (admin/index.html) and uses Supabase.
// Public site proxies to the old Node server only for backwards compatibility during dev.
const legacy = { target: "http://localhost:3001", changeOrigin: false };
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin/index.html"
      }
    }
  },
  server: {
    proxy: {
      "/api": legacy,
      "/uploads": legacy
    }
  }
});
