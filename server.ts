import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { askOphelia } from './api/chat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'academic-smart-guide-ophelia' });
});

// Ophelia Gemini Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await askOphelia({ message, history, context });
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Error handling /api/chat:', error);
    return res.status(500).json({
      error: error?.message || 'Error processing chat query with Ophelia',
    });
  }
});

// Vite middleware in dev, static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const distDir = path.resolve(__dirname, 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Academic Path Smart Guide server running on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
});
