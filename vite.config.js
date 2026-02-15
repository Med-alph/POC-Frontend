import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        // Use 127.0.0.1 to avoid IPv6 resolution issues
        target: 'http://127.0.0.1:9009',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy ERROR]:', err.code, req.url);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // console.log('[Vite Proxy Request]:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (req.url.includes('/auth/login') || req.url.includes('/auth/me')) {
              console.log('[Vite Proxy Response]:', req.url, proxyRes.statusCode);
              console.log('[Vite Proxy Cookies]:', proxyRes.headers['set-cookie']);
            }
          });
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:9009',
        ws: true,
        changeOrigin: true,
      },
    },
    // Required for multi-tenant subdomains
    allowedHosts: 'all',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
