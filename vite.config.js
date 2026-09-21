import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import https from 'node:https'
import http from 'node:http'

function devProxyPlugin() {
  return {
    name: 'dev-article-proxy',
    configureServer(server) {
      server.middlewares.use('/proxy', (req, res) => {
        const rawTarget = req.url.replace(/^\//, '');
        let initialUrl;
        try {
          initialUrl = new URL(rawTarget);
        } catch {
          res.statusCode = 400;
          res.end('Bad proxy URL');
          return;
        }

        function makeRequest(targetUrl, maxRedirects = 5) {
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
            if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
              if (maxRedirects > 0) {
                let newUrlStr = proxyRes.headers.location;
                if (newUrlStr.startsWith('/')) {
                   newUrlStr = targetUrl.origin + newUrlStr;
                }
                let newUrl;
                try {
                  newUrl = new URL(newUrlStr);
                } catch { }
                if (newUrl) {
                  makeRequest(newUrl, maxRedirects - 1);
                  return;
                }
              }
            }

            res.statusCode = proxyRes.statusCode;
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'text/html');
            res.setHeader('Access-Control-Allow-Origin', '*');
            proxyRes.pipe(res);
          });

          proxyReq.on('error', (err) => {
            console.error('[dev-proxy] error:', err.message);
            if (!res.headersSent) {
              res.statusCode = 502;
              res.end(`Proxy error: ${err.message}`);
            }
          });

          proxyReq.end();
        }

        makeRequest(initialUrl);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devProxyPlugin()],
  base: './',
  build: {
    sourcemap: true,
  },
})
