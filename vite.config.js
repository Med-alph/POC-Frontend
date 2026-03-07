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
        // Use your local backend for development
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
            // COOKIE STRIPPING LOGIC:
            // The backend sends cookies like 'domain=.medalph.com'.
            // Browsers on localhost REJECT these. We strip the domain so the 
            // browser treats them as 'host-only' for whatever domain you're on.
            // Also strip 'Secure' attribute from cookies for local development.
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              proxyRes.headers['set-cookie'] = cookies.map(cookie =>
                cookie.replace(/Domain=[^;]+;?/, '').replace(/Secure;?/i, '')
              );
            }

            if (req.url.includes('/auth/login') || req.url.includes('/auth/me')) {
              console.log('[Vite Proxy Response]:', req.url, proxyRes.statusCode);
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
