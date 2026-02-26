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
import analysis from './routes/analysis';
import payments from './routes/payments';

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

// Serve favicon files directly (no path prefix)
app.use('/favicon.ico', serveStatic({ root: './' }));
app.use('/favicon-*', serveStatic({ root: './' }));
app.use('/apple-touch-icon.png', serveStatic({ root: './' }));
app.use('/android-chrome-*', serveStatic({ root: './' }));

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
app.route('/api/analysis', analysis);
app.route('/api/payments', payments);

// Preview routes
app.route('/preview', preview);

// Payment callback pages
app.get('/payment/success', (c) => {
  const paymentKey = c.req.query('paymentKey');
  const orderId = c.req.query('orderId');
  const amount = c.req.query('amount');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>결제 성공 - WorVox</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div class="text-6xl mb-4">✅</div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">결제 처리 중...</h1>
                <p class="text-gray-600 mb-6">잠시만 기다려주세요</p>
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function confirmPayment() {
            try {
              const paymentKey = '${paymentKey}';
              const orderId = '${orderId}';
              const amount = parseInt('${amount}');
              
              const response = await axios.post('/api/payments/confirm', {
                paymentKey,
                orderId,
                amount
              });
              
              if (response.data.success) {
                document.body.innerHTML = \`
                  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                      <div class="text-6xl mb-4">🎉</div>
                      <h1 class="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h1>
                      <p class="text-gray-600 mb-6">결제가 성공적으로 완료되었습니다.</p>
                      <button 
                        onclick="window.location.href='/'"
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        홈으로 돌아가기
                      </button>
                    </div>
                  </div>
                \`;
              } else {
                throw new Error('결제 승인 실패');
              }
            } catch (error) {
              console.error('Payment confirmation error:', error);
              document.body.innerHTML = \`
                <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                  <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div class="text-6xl mb-4">❌</div>
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
                    <p class="text-gray-600 mb-6">\${error.message || '결제 처리 중 오류가 발생했습니다.'}</p>
                    <button 
                      onclick="window.location.href='/'"
                      class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      홈으로 돌아가기
                    </button>
                  </div>
                </div>
              \`;
            }
          }
          
          confirmPayment();
        </script>
    </body>
    </html>
  `);
});

app.get('/payment/fail', (c) => {
  const code = c.req.query('code');
  const message = c.req.query('message');
  const orderId = c.req.query('orderId');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>결제 실패 - WorVox</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div class="text-6xl mb-4">❌</div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
                <p class="text-gray-600 mb-2">${message || '결제가 취소되었습니다.'}</p>
                <p class="text-sm text-gray-400 mb-6">오류 코드: ${code || 'N/A'}</p>
                <button 
                  onclick="window.location.href='/'"
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  홈으로 돌아가기
                </button>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // Record payment failure
          const orderId = '${orderId}';
          if (orderId) {
            axios.post('/api/payments/fail', {
              orderId,
              code: '${code}',
              message: '${message}'
            }).catch(err => console.error('Failed to record payment failure:', err));
          }
        </script>
    </body>
    </html>
  `);
});

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
  const FORCE_VERSION = '20260226-billing-toggle-v1';
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
        
        <!-- Favicons -->
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css?v=${version}" rel="stylesheet">
        <!-- Toss Payments SDK -->
        <script src="https://js.tosspayments.com/v2/standard"></script>
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
