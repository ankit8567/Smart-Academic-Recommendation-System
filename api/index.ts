import type { IncomingMessage, ServerResponse } from 'http';
import { askOphelia } from './chat';

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Handle both pre-parsed body (Vercel Serverless) and streamed body
  let parsedBody: any = req.body;
  if (!parsedBody || typeof parsedBody === 'string') {
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch {
        parsedBody = {};
      }
    } else {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const raw = Buffer.concat(buffers).toString();
      try {
        parsedBody = JSON.parse(raw || '{}');
      } catch {
        parsedBody = {};
      }
    }
  }

  try {
    const { message, history, context } = parsedBody;

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
  } catch (error: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error?.message || 'Error executing Ophelia' }));
  }
}
