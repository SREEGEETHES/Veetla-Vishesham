import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import http from 'http';
import {defineConfig, Plugin} from 'vite';

function telegramProxyPlugin(): Plugin {
  return {
    name: 'telegram-call-proxy',
    configureServer(server) {
      server.middlewares.use('/api/telegram-call', (req, res) => {
        const urlObj = new URL(req.url || '', 'http://localhost:3000');
        const query = urlObj.search;
        const targetUrl = `http://api.callmebot.com/start.php${query}`;

        http.get(targetUrl, (proxyRes) => {
          let data = '';
          proxyRes.on('data', (chunk) => {
            data += chunk;
          });
          proxyRes.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = proxyRes.statusCode || 200;
            res.end(JSON.stringify({
              success: (proxyRes.statusCode || 200) < 400,
              message: data || 'Call signal sent to CallMeBot',
              status: proxyRes.statusCode
            }));
          });
        }).on('error', (err) => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 502;
          res.end(JSON.stringify({
            success: false,
            error: err.message
          }));
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), telegramProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
