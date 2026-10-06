import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Admin is now part of the Vite build (admin/index.html) and uses Supabase.
// Public site proxies to the old Node server only for backwards compatibility during dev.
const legacy = { target: "http://localhost:3001", changeOrigin: false };
export default defineConfig({
  plugins: [
    react(),
    // Dev only: /admin (no trailing slash) would fall through to the public site, so send it to the admin page.
    { name: "admin-slash", configureServer(server) { server.middlewares.use((req, res, next) => { if (req.url === "/admin") { res.writeHead(302, { Location: "/admin/" }); res.end(); } else next(); }); } }
  ],
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
