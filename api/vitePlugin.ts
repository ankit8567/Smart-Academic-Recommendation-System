import type { ViteDevServer } from 'vite';
import { askOphelia } from './chat';

export function opheliaApiPlugin() {
  return {
    name: 'ophelia-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { message, history, context } = parsed;

              if (!message || typeof message !== 'string') {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Message is required' }));
                return;
              }

              const reply = await askOphelia({ message, history, context });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply }));
            } catch (err: any) {
              console.error('Ophelia API error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err?.message || 'Internal server error processing request with Ophelia',
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}
