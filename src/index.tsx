import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import routes
import stt from './routes/stt';
import tts from './routes/tts';
import chat from './routes/chat';
import sessions from './routes/sessions';
import users from './routes/users';
import topics from './routes/topics';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API routes
app.route('/api/stt', stt);
app.route('/api/tts', tts);
app.route('/api/chat', chat);
app.route('/api/sessions', sessions);
app.route('/api/users', users);
app.route('/api/topics', topics);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HeySpeak - AI English Learning</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;
