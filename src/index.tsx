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
import history from './routes/history';
import vocabulary from './routes/vocabulary';
import preview from './routes/preview';
import gamification from './routes/gamification';
import usage from './routes/usage';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files with no-cache headers for JS files
app.use('/static/*.js', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
});

app.use('/static/*', serveStatic({ root: './public' }));

// API routes
app.route('/api/stt', stt);
app.route('/api/tts', tts);
app.route('/api/chat', chat);
app.route('/api/sessions', sessions);
app.route('/api/users', users);
app.route('/api/topics', topics);
app.route('/api/history', history);
app.route('/api/vocabulary', vocabulary);
app.route('/api/gamification', gamification);
app.route('/api/usage', usage);

// Preview routes
app.route('/preview', preview);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Main page
app.get('/', (c) => {
  // Force COMPLETE cache busting - change this number to force refresh
  const FORCE_VERSION = '20260224-v5';
  const version = `${FORCE_VERSION}-${Date.now()}`;
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WorVox - AI English Learning</title>
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
        <meta http-equiv="Pragma" content="no-cache">
        <meta http-equiv="Expires" content="0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css?v=${version}" rel="stylesheet">
        <!-- Google Sign-In -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <meta name="google-signin-client_id" content="506018364729-ichplnfnqlk2hmh1bhblepm0un44ltdr.apps.googleusercontent.com">
    </head>
    <body>
        <div id="app"></div>
        
        <script>
          // Force cache clear
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          console.log('WorVox v${FORCE_VERSION} - Cache cleared');
        </script>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="/static/gamification.js?v=${version}"></script>
        <script src="/static/app.js?v=${version}"></script>
    </body>
    </html>
  `, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
});

export default app;
