import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import https from 'node:https'
import http from 'node:http'

// Dev-only plugin: proxies /proxy/<full-url> requests server-side, bypassing CORS.
// Has zero impact on production Capacitor builds.
function devProxyPlugin() {
  return {
    name: 'dev-article-proxy',
    configureServer(server) {
      server.middlewares.use('/proxy', (req, res) => {
        // req.url = /https://www.livemint.com/...  (leading slash added by connect)
        const rawTarget = req.url.replace(/^\//, '');
        let targetUrl;
        try {
          targetUrl = new URL(rawTarget);
        } catch {
          res.statusCode = 400;
          res.end('Bad proxy URL');
          return;
        }

        const transport = targetUrl.protocol === 'https:' ? https : http;
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
          path: targetUrl.pathname + targetUrl.search,
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        };

        const proxyReq = transport.request(options, (proxyRes) => {
          res.statusCode = proxyRes.statusCode;
          // Forward content-type but strip CORS/security headers that block the browser
          res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'text/html');
          res.setHeader('Access-Control-Allow-Origin', '*');
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          console.error('[dev-proxy] error:', err.message);
          res.statusCode = 502;
          res.end(`Proxy error: ${err.message}`);
        });

        proxyReq.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devProxyPlugin()],
  // base './' is required for Capacitor — assets use relative paths in the APK
  base: './',
  build: {
    // Capacitor needs sourcemaps for debugging on device
    sourcemap: true,
  },
})

