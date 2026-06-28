import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  // ─── Dev server ────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9009',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req) => {
            console.error('[Vite Proxy ERROR]:', err.code, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            // COOKIE STRIPPING LOGIC:
            // The backend sends cookies like 'domain=.medalph.com'.
            // Browsers on localhost REJECT these. We strip the domain so the
            // browser treats them as 'host-only' for whatever domain you're on.
            // Also strip 'Secure' attribute from cookies for local development.
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              proxyRes.headers['set-cookie'] = cookies.map(cookie => {
                let c = cookie
                  .replace(/Domain=[^;]+;?\s*/i, '')
                  .replace(/Secure;?\s*/i, '');

                // Only downgrade SameSite=Strict → Lax on the access_token cookie.
                const isAccessTokenCookie = c.startsWith('access_token=');
                if (isAccessTokenCookie) {
                  c = c.replace(/SameSite=Strict;?\s*/i, 'SameSite=Lax; ');
                }

                return c;
              });
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

  // ─── Path aliases ───────────────────────────────────────────────────────────
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ─── Production build optimizations ────────────────────────────────────────
  build: {
    // Sourcemaps: hidden in production (not served publicly, but available for
    // error tracking tools like Sentry). Set to true for full inline maps,
    // false to strip entirely, 'hidden' to generate but not reference in bundle.
    sourcemap: mode === 'production' ? 'hidden' : true,

    // Warn when any individual chunk exceeds this size (in KB)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * manualChunks splits the bundle into cacheable, named vendor chunks.
         *
         * Strategy:
         *  - react-vendor     : React + ReactDOM + React Router (always needed, rarely change)
         *  - redux-vendor     : Redux Toolkit + React-Redux
         *  - ui-vendor        : Radix UI primitives + lucide icons + class utilities
         *  - chart-vendor     : Chart.js + Recharts (heavy, only on dashboard/revenue pages)
         *  - query-vendor     : TanStack React Query
         *  - socket-vendor    : Socket.IO client
         *  - editor-vendor    : React Quill (rich text editor)
         *  - date-vendor      : date-fns
         *
         * Heavy on-demand libs (jsPDF, XLSX, html2canvas, fabric) are NOT listed
         * here because they are already dynamic-imported at the call sites and
         * Rollup will automatically split them into their own async chunks.
         */
        manualChunks: (id) => {
          // React core runtime
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          // Redux
          if (
            id.includes('node_modules/@reduxjs/') ||
            id.includes('node_modules/react-redux/') ||
            id.includes('node_modules/immer/')
          ) {
            return 'redux-vendor';
          }

          // TanStack Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'query-vendor';
          }

          // Radix UI + Lucide icons + class utilities
          if (
            id.includes('node_modules/@radix-ui/') ||
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/class-variance-authority/') ||
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/')
          ) {
            return 'ui-vendor';
          }

          // Charts (Chart.js + Recharts) — kept separate from ui-vendor to avoid circular dep
          if (
            id.includes('node_modules/chart.js/') ||
            id.includes('node_modules/react-chartjs-2/')
          ) {
            return 'chartjs-vendor';
          }

          if (id.includes('node_modules/recharts/')) {
            return 'recharts-vendor';
          }

          // Socket.IO
          if (
            id.includes('node_modules/socket.io-client/') ||
            id.includes('node_modules/engine.io-client/')
          ) {
            return 'socket-vendor';
          }

          // Rich text editor
          if (
            id.includes('node_modules/react-quill') ||
            id.includes('node_modules/quill/')
          ) {
            return 'editor-vendor';
          }

          // Date utilities
          if (id.includes('node_modules/date-fns/')) {
            return 'date-vendor';
          }

          // Misc UI
          if (
            id.includes('node_modules/react-hot-toast/') ||
            id.includes('node_modules/sonner/') ||
            id.includes('node_modules/next-themes/')
          ) {
            return 'toast-vendor';
          }

          // Image / gallery utilities
          if (
            id.includes('node_modules/react-compare-image/') ||
            id.includes('node_modules/react-zoom-pan-pinch/') ||
            id.includes('node_modules/react-easy-crop/') ||
            id.includes('node_modules/react-image-crop/') ||
            id.includes('node_modules/re-resizable/')
          ) {
            return 'image-vendor';
          }

          // Axios
          if (id.includes('node_modules/axios/')) {
            return 'axios-vendor';
          }
        },
      },
    },
  },
}));
