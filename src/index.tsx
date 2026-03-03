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
import admin from './routes/admin';
import attendance from './routes/attendance';
import pronunciationAnalysis from './routes/pronunciation-analysis';
import modeReports from './routes/mode-reports';
import aiPrompts from './routes/ai-prompts';
import emailNotifications from './routes/email-notifications';
import scheduled from './scheduled';

const app = new Hono<{ Bindings: Bindings }>();

// Redirect www to non-www
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === 'www.worvox.com') {
    return c.redirect(`https://worvox.com${url.pathname}${url.search}`, 301);
  }
  await next();
});

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

// Naver Webmaster verification file
app.get('/naver2b8cc0248abdd5b43e205955b8ef7247.html', async (c) => {
  return c.text('naver-site-verification: naver2b8cc0248abdd5b43e205955b8ef7247.html', 200, {
    'Content-Type': 'text/html; charset=utf-8'
  });
});

// SEO files - serve from root directory
app.get('/robots.txt', async (c) => {
  return c.text(`# robots.txt for WorVox - AI English Learning Platform
User-agent: *
Allow: /
Allow: /about
Allow: /pricing
Disallow: /api/
Disallow: /admin/
Disallow: /payment/
Disallow: /*.json$
Disallow: /*?*session=*

# Block AI training crawlers (protect user content)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Google-Extended
Disallow: /

# Sitemap
Sitemap: https://worvox.com/sitemap.xml

# Crawl-delay for good behavior
Crawl-delay: 1`, 200, {
    'Content-Type': 'text/plain'
  });
});

app.get('/sitemap.xml', async (c) => {
  return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://worvox.com/</loc>
    <lastmod>2026-03-03</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ko" href="https://worvox.com/" />
  </url>
  <url>
    <loc>https://worvox.com/pricing</loc>
    <lastmod>2026-03-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://worvox.com/about</loc>
    <lastmod>2026-03-03</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://worvox.com/features</loc>
    <lastmod>2026-03-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`, 200, {
    'Content-Type': 'application/xml'
  });
});

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
app.route('/api/admin', admin);
app.route('/api/attendance', attendance);
app.route('/api/pronunciation', pronunciationAnalysis);
app.route('/api/mode-reports', modeReports);
app.route('/api/ai-prompts', aiPrompts);
app.route('/api/email-notifications', emailNotifications);

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
        <!-- Google tag (gtag.js) - MUST BE FIRST -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
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
        <!-- Google tag (gtag.js) - MUST BE FIRST -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
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

// Trial Success - Billing key registered
app.get('/trial-success', (c) => {
  const authKey = c.req.query('authKey');
  const customerKey = c.req.query('customerKey');
  const plan = c.req.query('plan');
  const userId = c.req.query('userId');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <!-- Google tag (gtag.js) - MUST BE FIRST -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>무료 체험 시작 - WorVox</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gradient-to-br from-green-50 to-emerald-50">
        <div id="content" class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p class="text-gray-600">무료 체험을 활성화하는 중...</p>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          async function activateTrial() {
            try {
              const response = await axios.post('/api/payments/trial/confirm', {
                userId: '${userId}',
                plan: '${plan}',
                billingKey: '${authKey}',
                customerKey: '${customerKey}'
              });
              
              if (response.data.success) {
                document.getElementById('content').innerHTML = \`
                  <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div class="text-6xl mb-4">🎉</div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-3">무료 체험 시작!</h1>
                    <p class="text-gray-600 mb-4">
                      <strong class="text-green-600">${plan === 'core' ? 'Core' : 'Premium'}</strong> 플랜을 2주간 무료로 사용하실 수 있습니다!
                    </p>
                    
                    <div class="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                      <p class="text-sm text-gray-700 mb-2">
                        <i class="fas fa-calendar-check text-blue-600 mr-2"></i>
                        체험 종료일: <strong>\${new Date(response.data.trialEndDate).toLocaleDateString('ko-KR')}</strong>
                      </p>
                      <p class="text-sm text-gray-700">
                        <i class="fas fa-credit-card text-blue-600 mr-2"></i>
                        자동 결제 금액: <strong>${plan === 'core' ? '₩9,900' : '₩19,000'}</strong>/월
                      </p>
                    </div>
                    
                    <p class="text-xs text-gray-500 mb-6">
                      💡 체험 종료 3일 전에 이메일로 알려드립니다.<br/>
                      언제든 내 정보 > 구독 관리에서 해지하실 수 있습니다.
                    </p>
                    
                    <button 
                      onclick="window.location.href='/'"
                      class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
                    >
                      시작하기
                    </button>
                  </div>
                \`;
              } else {
                throw new Error('체험 활성화 실패');
              }
            } catch (error) {
              console.error('Trial activation error:', error);
              document.getElementById('content').innerHTML = \`
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                  <div class="text-6xl mb-4">❌</div>
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
                  <p class="text-gray-600 mb-6">무료 체험 활성화 중 문제가 발생했습니다.</p>
                  <button 
                    onclick="window.location.href='/'"
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    홈으로 돌아가기
                  </button>
                </div>
              \`;
            }
          }
          
          activateTrial();
        </script>
    </body>
    </html>
  `);
});

// Trial Fail - Billing key registration failed
app.get('/trial-fail', (c) => {
  const code = c.req.query('code');
  const message = c.req.query('message');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <!-- Google tag (gtag.js) - MUST BE FIRST -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>무료 체험 실패 - WorVox</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div class="text-6xl mb-4">❌</div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">카드 등록 실패</h1>
                <p class="text-gray-600 mb-2">${message || '카드 등록이 취소되었습니다.'}</p>
                <p class="text-sm text-gray-400 mb-6">오류 코드: ${code || 'N/A'}</p>
                <button 
                  onclick="window.location.href='/'"
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  홈으로 돌아가기
                </button>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Landing page - Branding page for non-logged users (same as /about but with app link)
app.get('/landing', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <meta name="theme-color" content="#a855f7">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>WorVox | AI 영어 학습 플랫폼 - 실시간 발음 교정 & 맞춤형 회화 연습</title>
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="WorVox AI 영어 학습 플랫폼 - GPT-4 기반 실시간 발음 교정, ElevenLabs TTS 음성 합성, 30가지 실전 시나리오로 영어 회화 실력 3배 향상. 월 1.9만원으로 24시간 무제한 학습. 2주 무료 체험 시작!">
        <meta name="keywords" content="AI 영어 학습, 영어 발음 교정, 영어 회화 연습, OPIC 준비, 영어 말하기, GPT-4 영어, ElevenLabs, 실시간 피드백, 영어 학원 대체, 온라인 영어 과외, AI 영어 코치, 영어 공부 앱, 영어 스피킹, 발음 분석, 맞춤형 영어 학습">
        <meta name="robots" content="index, follow">
        
        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://worvox.com">
        <meta property="og:title" content="WorVox - AI 영어 학습 플랫폼 | 실시간 발음 교정 & 회화 연습">
        <meta property="og:description" content="GPT-4 기반 AI로 영어 회화 실력 3배 향상! 실시간 발음 교정, 30가지 실전 시나리오, OPIC 준비. 월 1.9만원, 2주 무료 체험!">
        <meta property="og:image" content="https://worvox.com/logo.png">
        
        <link rel="canonical" href="https://worvox.com">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <!-- Navigation -->
        <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <a href="/landing" class="flex items-center space-x-2">
                        <img src="/static/logo.webp" alt="WorVox Logo" class="h-8 w-8">
                        <span class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">WorVox</span>
                    </a>
                    <div class="flex items-center gap-4">
                        <a href="/pricing" class="text-gray-700 hover:text-purple-600 font-medium transition">
                            <i class="fas fa-tag mr-2"></i>요금제
                        </a>
                        <a href="/app" class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105">
                            <i class="fas fa-sign-in-alt mr-2"></i>로그인 / 시작하기
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="pt-20 pb-16 px-4">
            <div class="max-w-4xl mx-auto text-center">
                <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    <span class="bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                        AI 영어 학습 플랫폼
                    </span>
                    <br/>
                    <span class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">실시간 발음 교정 & 맞춤형 회화 연습</span>
                </h1>
                <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed px-2">
                    GPT-4 기반 AI로 <strong>영어 회화 실력 3배 향상</strong>!<br class="hidden sm:block"/>
                    <span class="block sm:inline">실시간 발음 분석, 30가지 실전 시나리오,</span>
                    <span class="block sm:inline">OPIC 준비까지 - 월 1.9만원</span>
                </p>
                <a href="/app" 
                   class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition transform hover:scale-105"
                   onclick="gtag('event', 'cta_click', { 'event_category': 'engagement', 'event_label': 'hero_cta_start_trial', 'value': 1 })">
                    <i class="fas fa-rocket mr-2"></i>2주 무료 체험 시작
                </a>
            </div>
        </section>

        <!-- Mission Section -->
        <section class="py-16 px-4 bg-white">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">우리의 미션</h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                        누구나 쉽고 효과적으로 영어를 마스터할 수 있도록,<br/>
                        AI 기술로 학습 장벽을 허물고 있습니다.
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
                        <div class="text-5xl mb-4">🎯</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-3">개인화된 학습</h3>
                        <p class="text-gray-700 leading-relaxed">
                            GPT-4 기반 AI가 당신의 수준과 목표에 맞춘 맞춤형 학습 경험을 제공합니다. 
                            초급부터 고급까지, 당신만의 학습 여정을 만들어갑니다.
                        </p>
                    </div>

                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
                        <div class="text-5xl mb-4">🎤</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-3">실시간 피드백</h3>
                        <p class="text-gray-700 leading-relaxed">
                            ElevenLabs 최신 TTS 기술과 정밀한 음성 인식으로 실시간 발음 교정을 받으세요. 
                            정확도, 유창성, 억양까지 세밀하게 분석합니다.
                        </p>
                    </div>

                    <div class="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
                        <div class="text-5xl mb-4">💪</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-3">실전 중심</h3>
                        <p class="text-gray-700 leading-relaxed">
                            타이머 모드, 시나리오 모드, OPIC 스타일 시험으로 실전 감각을 키우세요. 
                            실제 상황에 바로 적용 가능한 실용적 영어를 배웁니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- What You Get Section -->
        <section class="py-16 px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">WorVox와 함께 얻는 것</h2>
                    <p class="text-xl text-gray-600">AI 기술이 선사하는 차별화된 학습 경험</p>
                </div>

                <div class="space-y-8">
                    <!-- Benefit 1 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            🚀
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">빠른 실력 향상</h3>
                            <p class="text-gray-700 leading-relaxed">
                                AI가 당신의 약점을 정확히 파악하고 집중 학습 계획을 제시합니다. 
                                일반적인 학습보다 3배 빠른 속도로 발음과 유창성이 개선됩니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">정확한 발음 분석</span>
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">맞춤형 피드백</span>
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">즉각적인 교정</span>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 2 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            💡
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">자신감 있는 영어 구사</h3>
                            <p class="text-gray-700 leading-relaxed">
                                실전 시나리오와 반복 연습으로 자연스러운 영어 대화 능력을 키웁니다. 
                                실제 상황에서 당황하지 않고 자신감 있게 말할 수 있게 됩니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">실전 시나리오</span>
                                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">OPIC 준비</span>
                                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">회화 연습</span>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 3 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            ⏰
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">시간과 비용 절약</h3>
                            <p class="text-gray-700 leading-relaxed">
                                24시간 언제 어디서나 학습 가능하며, 일반 영어 학원 비용의 1/10 수준입니다. 
                                출퇴근 시간, 점심 시간에도 효과적으로 영어 실력을 쌓으세요.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">월 19,000원부터</span>
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">24시간 이용</span>
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">무제한 연습</span>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 4 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            📊
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">데이터 기반 학습 관리</h3>
                            <p class="text-gray-700 leading-relaxed">
                                학습 진도, 발음 개선 추이, 취약점 분석 등 상세한 리포트로 내 성장을 눈으로 확인하세요. 
                                AI가 제안하는 다음 학습 단계로 효율적인 성장이 가능합니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">상세 분석</span>
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">진도 추적</span>
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">성장 리포트</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        <!-- Feature Demo GIF Section -->
        <section class="py-16 px-4 bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">실제 사용 모습을 확인하세요</h2>
                    <p class="text-xl text-gray-600">WorVox의 핵심 기능을 직접 체험해보세요</p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Demo 1: Timer Mode -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-105 hover:shadow-2xl">
                        <div class="relative bg-gradient-to-br from-purple-500 to-purple-600 p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-2xl font-bold text-white">타이머 모드</h3>
                                <span class="text-4xl">⏱️</span>
                            </div>
                            <p class="text-purple-100 mb-4">압박 상황에서 빠른 반응력 훈련</p>
                            <div class="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                                <i class="fas fa-check mr-2"></i>5초/10초 시간 제한
                            </div>
                        </div>
                        
                        <!-- Timer Challenge Demo Image -->
                        <div class="aspect-video bg-gray-100 relative group cursor-pointer overflow-hidden"
                             onclick="gtag('event', 'demo_image_click', { 'event_category': 'engagement', 'event_label': 'timer_challenge_demo', 'value': 1 })">
                            <picture>
                                <source srcset="/static/demo-timer-challenge.webp" type="image/webp">
                                <img src="/static/demo-timer-challenge.png" 
                                     alt="타이머 챌린지 모드 - 실시간 발음 분석 데모" 
                                     class="w-full h-full object-cover"
                                     loading="lazy">
                            </picture>
                            <div class="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                <div class="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <i class="fas fa-search-plus text-5xl mb-3"></i>
                                    <p class="text-lg font-semibold">자세히 보기</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-bolt text-purple-600 mt-1"></i>
                                    <div>
                                        <div class="font-semibold text-gray-900">즉각적인 피드백</div>
                                        <div class="text-sm text-gray-600">발음·유창성 실시간 분석</div>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-chart-bar text-purple-600 mt-1"></i>
                                    <div>
                                        <div class="font-semibold text-gray-900">상세 점수</div>
                                        <div class="text-sm text-gray-600">정확도·발음·유창성 측정</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Demo 2: Scenario Mode -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-105 hover:shadow-2xl">
                        <div class="relative bg-gradient-to-br from-blue-500 to-blue-600 p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-2xl font-bold text-white">시나리오 모드</h3>
                                <span class="text-4xl">🎭</span>
                            </div>
                            <p class="text-blue-100 mb-4">30가지 실생활 상황 연습</p>
                            <div class="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                                <i class="fas fa-check mr-2"></i>공항·호텔·레스토랑 등
                            </div>
                        </div>
                        
                        <!-- Scenario Mode Demo Image -->
                        <div class="aspect-video bg-gray-100 relative group cursor-pointer overflow-hidden"
                             onclick="gtag('event', 'demo_image_click', { 'event_category': 'engagement', 'event_label': 'scenario_mode_demo', 'value': 1 })">
                            <picture>
                                <source srcset="/static/demo-scenario-mode.webp" type="image/webp">
                                <img src="/static/demo-scenario-mode.png" 
                                     alt="시나리오 모드 - 실전 회화 연습 데모" 
                                     class="w-full h-full object-cover"
                                     loading="lazy">
                            </picture>
                            <div class="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                <div class="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <i class="fas fa-search-plus text-5xl mb-3"></i>
                                    <p class="text-lg font-semibold">자세히 보기</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-globe text-blue-600 mt-1"></i>
                                    <div>
                                        <div class="font-semibold text-gray-900">실전 대화</div>
                                        <div class="text-sm text-gray-600">여행·비즈니스·일상</div>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-language text-blue-600 mt-1"></i>
                                    <div>
                                        <div class="font-semibold text-gray-900">자연스러운 표현</div>
                                        <div class="text-sm text-gray-600">원어민 수준 문장</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Demo 3: Exam Mode -->
                    <div class="bg-white rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-105 hover:shadow-2xl">
                        <div class="relative bg-gradient-to-br from-green-500 to-green-600 p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-2xl font-bold text-white">시험 모드</h3>
                                <span class="text-4xl">🎓</span>
                            </div>
                            <p class="text-green-100 mb-4">OPIC 스타일 실전 모의고사</p>
                            <div class="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                                <i class="fas fa-check mr-2"></i>5문항 종합 평가
                            </div>
                        </div>
                        
                        <!-- Exam Mode Demo Image -->
                        <div class="aspect-video bg-gray-100 relative group cursor-pointer overflow-hidden"
                             onclick="gtag('event', 'demo_image_click', { 'event_category': 'engagement', 'event_label': 'exam_mode_demo', 'value': 1 })">
                            <picture>
                                <source srcset="/static/demo-ai-analysis.webp" type="image/webp">
                                <img src="/static/demo-ai-analysis.png" 
                                     alt="시험 모드 - OPIC 준비 및 분석 데모" 
                                     class="w-full h-full object-cover"
                                     loading="lazy">
                            </picture>
                            <div class="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                <div class="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <i class="fas fa-search-plus text-5xl mb-3"></i>
                                    <p class="text-lg font-semibold">자세히 보기</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-6">
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-medal text-green-600 mt-1"></i>
                                    <div>
                                        <div class="font-semibold text-gray-900">레벨 평가</div>
                                        <div class="text-sm text-gray-600">Novice ~ Advanced</div>
                                    </div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-lightbulb text-green-600 mt-1"></i>
                                    <div>
                                        <div class="font-semibold text-gray-900">개선 답변 예시</div>
                                        <div class="text-sm text-gray-600">Premium 전용</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CTA -->
                <div class="mt-16 text-center">
                    <p class="text-gray-600 mb-6 text-lg">
                        💡 실제 GIF 애니메이션은 곧 추가됩니다
                    </p>
                    <a href="/app" 
                       class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105"
                       onclick="gtag('event', 'cta_click', { 'event_category': 'engagement', 'event_label': 'demo_section_cta', 'value': 1 })">
                        <i class="fas fa-rocket mr-2"></i>지금 바로 체험하기
                    </a>
                </div>
            </div>
        </section>
        <!-- Technology Section -->
        <section class="py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">최첨단 AI 기술</h2>
                    <p class="text-xl text-gray-600">세계 최고 수준의 AI 기술로 구축된 학습 플랫폼</p>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-brain text-2xl text-purple-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">GPT-4 언어 모델</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            OpenAI의 최신 GPT-4 모델로 자연스러운 대화와 정확한 피드백을 제공합니다. 
                            문맥을 이해하고 수준에 맞는 답변을 생성합니다.
                        </p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-microphone text-2xl text-blue-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">ElevenLabs TTS</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            세계 최고 수준의 음성 합성 기술로 원어민 수준의 자연스러운 발음을 들려드립니다. 
                            감정과 억양까지 살아있는 음성으로 학습하세요.
                        </p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-wave-square text-2xl text-green-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">실시간 음성 인식</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            정밀한 STT(Speech-to-Text) 기술로 당신의 발음을 실시간 분석합니다. 
                            정확도, 유창성, 억양을 객관적으로 평가합니다.
                        </p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-chart-line text-2xl text-orange-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">맞춤형 학습 알고리즘</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            머신러닝 기반 알고리즘이 당신의 학습 패턴을 분석하고 최적화된 학습 경로를 제시합니다. 
                            효율적인 학습으로 빠른 성장을 보장합니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->

        <!-- Comparison Table Section -->
        <section class="py-16 px-4 bg-white">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">왜 WorVox를 선택해야 할까요?</h2>
                    <p class="text-xl text-gray-600">일반 영어 학원 및 다른 플랫폼과의 비교</p>
                </div>

                <!-- Comparison Table -->
                <div class="mb-16">
                    <p class="text-center text-sm text-gray-500 mb-4 md:hidden">
                        <i class="fas fa-arrows-alt-h mr-2"></i>좌우로 스크롤하여 전체 비교표를 확인하세요
                    </p>
                    <div class="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <div class="inline-block min-w-full">
                            <table class="w-full bg-white rounded-2xl shadow-xl overflow-hidden" style="min-width: 600px;">
                                <thead>
                                    <tr class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                                        <th class="py-4 sm:py-6 px-3 sm:px-6 text-left font-bold text-sm sm:text-lg">항목</th>
                                        <th class="py-4 sm:py-6 px-3 sm:px-6 text-center font-bold text-sm sm:text-lg">
                                            <div class="flex flex-col items-center">
                                                <span class="text-xl sm:text-2xl mb-2">🏢</span>
                                                <span class="text-xs sm:text-base">일반 영어 학원</span>
                                            </div>
                                        </th>
                                        <th class="py-4 sm:py-6 px-3 sm:px-6 text-center font-bold text-sm sm:text-lg">
                                            <div class="flex flex-col items-center">
                                                <span class="text-xl sm:text-2xl mb-2">💻</span>
                                                <span class="text-xs sm:text-base">일반 온라인 강의</span>
                                            </div>
                                        </th>
                                        <th class="py-4 sm:py-6 px-3 sm:px-6 text-center font-bold text-sm sm:text-lg bg-yellow-400 text-purple-900">
                                            <div class="flex flex-col items-center">
                                                <span class="text-xl sm:text-2xl mb-2">👑</span>
                                                <span class="text-xs sm:text-base">WorVox</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                            <!-- 가격 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-won-sign text-purple-600 mr-2"></i>가격
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center text-red-600 font-semibold text-sm sm:text-base">
                                    월 20-40만원
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center text-orange-600 font-semibold text-sm sm:text-base">
                                    월 5-15만원
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold text-base sm:text-lg">월 1.9만원</div>
                                    <div class="text-xs sm:text-sm text-gray-600">연간 할인 18%</div>
                                </td>
                            </tr>
                            
                            <!-- 시간 제약 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-clock text-purple-600 mr-2"></i>시간 제약
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">정해진 시간</span><br/>
                                    <span class="text-sm text-gray-600">(주 2-3회)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">일부 제한</span><br/>
                                    <span class="text-sm text-gray-600">(강의 스케줄)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">24시간 무제한</div>
                                    <div class="text-sm text-gray-600">언제 어디서나</div>
                                </td>
                            </tr>
                            
                            <!-- 개인화 학습 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-user-cog text-purple-600 mr-2"></i>개인화 학습
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">제한적</span><br/>
                                    <span class="text-sm text-gray-600">(그룹 수업)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">없음</span><br/>
                                    <span class="text-sm text-gray-600">(일방향 강의)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">GPT-4 AI 맞춤</div>
                                    <div class="text-sm text-gray-600">수준별 완벽 대응</div>
                                </td>
                            </tr>
                            
                            <!-- 실시간 피드백 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-comments text-purple-600 mr-2"></i>실시간 피드백
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">간헐적</span><br/>
                                    <span class="text-sm text-gray-600">(수업 중만)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">없음</span><br/>
                                    <span class="text-sm text-gray-600">(녹화 강의)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">즉각 분석</div>
                                    <div class="text-sm text-gray-600">AI 발음·유창성 평가</div>
                                </td>
                            </tr>
                            
                            <!-- 발음 교정 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-microphone-alt text-purple-600 mr-2"></i>발음 교정
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">주관적</span><br/>
                                    <span class="text-sm text-gray-600">(강사 재량)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">불가능</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">정밀 AI 분석</div>
                                    <div class="text-sm text-gray-600">정확도 수치화</div>
                                </td>
                            </tr>
                            
                            <!-- 학습 기록 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-chart-line text-purple-600 mr-2"></i>학습 기록 관리
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">수동 관리</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">기본 수준</span><br/>
                                    <span class="text-sm text-gray-600">(진도율만)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">자동 상세 분석</div>
                                    <div class="text-sm text-gray-600">성장 그래프 제공</div>
                                </td>
                            </tr>
                            
                            <!-- OPIC 준비 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-graduation-cap text-purple-600 mr-2"></i>OPIC 준비
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">별도 비용</span><br/>
                                    <span class="text-sm text-gray-600">(특강 추가)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">제한적</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">무료 포함</div>
                                    <div class="text-sm text-gray-600">실전 시험 모드</div>
                                </td>
                            </tr>
                            
                            <!-- 편의성 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-map-marker-alt text-purple-600 mr-2"></i>장소/이동
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">학원 방문 필수</span><br/>
                                    <span class="text-sm text-gray-600">(교통비·시간)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-green-600">온라인</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">완전 온라인</div>
                                    <div class="text-sm text-gray-600">모바일 지원</div>
                                </td>
                            </tr>
                            
                            <!-- 학습 효율 -->
                            <tr class="hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-rocket text-purple-600 mr-2"></i>학습 효율
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">보통</span><br/>
                                    <span class="text-sm text-gray-600">(주 2-3시간)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">느림</span><br/>
                                    <span class="text-sm text-gray-600">(일방향 학습)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">3배 빠름</div>
                                    <div class="text-sm text-gray-600">AI 집중 학습</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Highlight Box -->
                <div class="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
                    <h3 class="text-3xl font-bold mb-4">💰 비용 절감 효과</h3>
                    <div class="grid md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <div class="text-4xl font-bold mb-2">1/20</div>
                            <div class="text-purple-100">일반 학원 대비</div>
                        </div>
                        <div>
                            <div class="text-4xl font-bold mb-2">3배</div>
                            <div class="text-purple-100">빠른 학습 속도</div>
                        </div>
                        <div>
                            <div class="text-4xl font-bold mb-2">24/7</div>
                            <div class="text-purple-100">무제한 이용</div>
                        </div>
                    </div>
                    <p class="text-xl text-purple-100 mb-6">
                        연간 약 <span class="text-yellow-300 font-bold">240만원 절약</span> 가능!
                    </p>
                    <a href="/app" class="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">
                        <i class="fas fa-gift mr-2"></i>2주 무료로 체험하기
                    </a>
                </div>
            </div>
        </section>
        <section class="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                    지금 바로 시작하세요
                </h2>
                <p class="text-xl text-purple-100 mb-8">
                    2주 무료 체험으로 WorVox의 모든 기능을 경험해보세요
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/app" 
                       class="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
                       onclick="gtag('event', 'cta_click', { 'event_category': 'engagement', 'event_label': 'main_cta_start_trial', 'value': 1 })">
                        <i class="fas fa-rocket mr-2"></i>무료 체험 시작
                    </a>
                    <a href="/pricing" 
                       class="bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-800 transition transform hover:scale-105 shadow-xl border-2 border-white/30"
                       onclick="gtag('event', 'navigation_click', { 'event_category': 'engagement', 'event_label': 'pricing_link', 'value': 1 })">
                        <i class="fas fa-tag mr-2"></i>요금제 보기
                    </a>
                </div>
                <p class="text-purple-200 mt-6">
                    💳 신용카드 등록 없이 바로 시작 • ✨ 언제든 취소 가능
                </p>
            </div>
        </section>

        <!-- Footer -->
        <!-- Footer -->
        <footer class="bg-gray-900 text-gray-300 py-16 px-4">
            <div class="max-w-6xl mx-auto">
                <div class="grid md:grid-cols-4 gap-8 mb-12">
                    <!-- Company Info -->
                    <div class="md:col-span-2">
                        <div class="flex items-center gap-2 mb-4">
                            <img src="/static/logo.webp" alt="WorVox Logo" class="h-10 w-10">
                            <span class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">WorVox</span>
                        </div>
                        <p class="text-gray-400 mb-4 leading-relaxed">
                            AI 기반 영어 학습 플랫폼 - GPT-4와 ElevenLabs 기술로<br/>
                            실시간 발음 교정과 맞춤형 회화 연습을 제공합니다.
                        </p>
                        <div class="flex gap-4">
                            <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition">
                                <i class="fab fa-youtube"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div>
                        <h3 class="text-white font-bold text-lg mb-4">서비스</h3>
                        <ul class="space-y-3">
                            <li><a href="/landing" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-home text-xs"></i> 홈
                            </a></li>
                            <li><a href="/about" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-info-circle text-xs"></i> 회사 소개
                            </a></li>
                            <li><a href="/pricing" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-tag text-xs"></i> 요금제
                            </a></li>
                            <li><a href="/app" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-sign-in-alt text-xs"></i> 로그인
                            </a></li>
                        </ul>
                    </div>

                    <!-- Support -->
                    <div>
                        <h3 class="text-white font-bold text-lg mb-4">지원</h3>
                        <ul class="space-y-3">
                            <li><a href="#" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-question-circle text-xs"></i> FAQ
                            </a></li>
                            <li><a href="#" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-book text-xs"></i> 사용 가이드
                            </a></li>
                            <li><a href="#" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-envelope text-xs"></i> 문의하기
                            </a></li>
                            <li><a href="#" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-shield-alt text-xs"></i> 개인정보처리방침
                            </a></li>
                            <li><a href="#" class="hover:text-purple-400 transition flex items-center gap-2">
                                <i class="fas fa-file-contract text-xs"></i> 이용약관
                            </a></li>
                        </ul>
                    </div>
                </div>

                <!-- Bottom Bar -->
                <div class="border-t border-gray-800 pt-8">
                    <!-- Business Info -->
                    <div class="mb-6 text-sm text-gray-500">
                        <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                            <span class="font-medium text-gray-300">위아솔루션즈</span>
                            <span class="text-gray-600 hidden md:inline">|</span>
                            <span>대표자: 이강돈</span>
                            <span class="text-gray-600 hidden md:inline">|</span>
                            <span>사업자번호: 542-07-02097</span>
                        </div>
                        <div class="mb-2">
                            <span>주소: 대전광역시 서구 대덕대로241번길 20, 5층 548-2호</span>
                        </div>
                        <div class="flex flex-col md:flex-row md:items-center gap-2">
                            <span>통신판매: 제 2021-대전동구-0501호</span>
                            <span class="text-gray-600 hidden md:inline">|</span>
                            <span>문의전화: 070-8064-0485</span>
                            <span class="text-gray-600 hidden md:inline">|</span>
                            <span class="flex items-center gap-2">
                                <i class="fas fa-envelope text-purple-400"></i>
                                support@worvox.com
                            </span>
                        </div>
                    </div>

                    <!-- Copyright & Links -->
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-gray-800">
                        <p class="text-sm text-gray-500">
                            © 2026 WorVox. All rights reserved.
                        </p>
                        <div class="flex flex-wrap items-center gap-4 text-sm">
                            <a href="#" class="hover:text-purple-400 transition">이용약관</a>
                            <span class="text-gray-700">|</span>
                            <a href="#" class="hover:text-purple-400 transition">개인정보처리방침</a>
                            <span class="text-gray-700">|</span>
                            <a href="#" class="hover:text-purple-400 transition">환불정책</a>
                            <span class="text-gray-700 hidden md:inline">|</span>
                            <span class="flex items-center gap-2">
                                <i class="fas fa-globe text-purple-400"></i>
                                한국어 🇰🇷
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>

        <!-- Google Analytics -->
        <script>
          gtag('event', 'page_view', {
            page_title: 'Landing Page',
            page_location: window.location.href,
            page_path: window.location.pathname
          });
        </script>
    </body>
    </html>
  `);
});

// About page - Company introduction and branding
app.get('/about', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <meta name="theme-color" content="#a855f7">
        <title>WorVox 소개 - AI 영어 학습의 새로운 기준</title>
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="WorVox는 최첨단 AI 기술로 영어 학습의 패러다임을 바꿉니다. ElevenLabs 음성 합성, GPT-4 기반 맞춤형 대화, 실시간 발음 분석으로 누구나 쉽고 효과적으로 영어를 마스터할 수 있습니다.">
        <meta name="keywords" content="WorVox 소개, AI 영어 학습 회사, 영어 교육 기술, AI 발음 교정, 영어 학습 플랫폼, ElevenLabs, GPT-4, 영어 코치">
        <meta name="robots" content="index, follow">
        
        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://worvox.com/about">
        <meta property="og:title" content="WorVox 소개 - AI 영어 학습의 새로운 기준">
        <meta property="og:description" content="최첨단 AI 기술로 영어 학습의 패러다임을 바꾸는 WorVox. 실시간 발음 교정, 맞춤형 학습, OPIC 준비까지.">
        <meta property="og:image" content="https://worvox.com/logo.png">
        
        <link rel="canonical" href="https://worvox.com/about">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- JSON-LD for About Page -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "WorVox 소개",
          "description": "AI 영어 학습 플랫폼 WorVox의 회사 소개 및 비전",
          "url": "https://worvox.com/about",
          "mainEntity": {
            "@type": "EducationalOrganization",
            "name": "WorVox",
            "description": "AI 기반 영어 학습 플랫폼"
          }
        }
        </script>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <!-- Navigation -->
        <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <a href="/" class="flex items-center space-x-2">
                        <img src="/static/logo.webp" alt="WorVox Logo" class="h-8 w-8">
                        <span class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">WorVox</span>
                    </a>
                    <div class="flex items-center gap-4">
                        <a href="/pricing" class="text-gray-700 hover:text-purple-600 font-medium transition">
                            <i class="fas fa-tag mr-2"></i>요금제
                        </a>
                        <a href="/" class="text-gray-700 hover:text-purple-600 font-medium transition">
                            <i class="fas fa-home mr-2"></i>홈으로
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="pt-20 pb-16 px-4">
            <div class="max-w-4xl mx-auto text-center">
                <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                    <span class="bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                        AI가 만드는
                    </span>
                    <br/>
                    영어 학습의 새로운 기준
                </h1>
                <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                    WorVox는 최첨단 AI 기술로 영어 학습의 패러다임을 바꿉니다.<br/>
                    실시간 발음 교정부터 개인화된 학습까지, 당신만의 AI 영어 코치를 경험하세요.
                </p>
            </div>
        </section>

        <!-- Mission Section -->
        <section class="py-16 px-4 bg-white">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">우리의 미션</h2>
                    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                        누구나 쉽고 효과적으로 영어를 마스터할 수 있도록,<br/>
                        AI 기술로 학습 장벽을 허물고 있습니다.
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
                        <div class="text-5xl mb-4">🎯</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-3">개인화된 학습</h3>
                        <p class="text-gray-700 leading-relaxed">
                            GPT-4 기반 AI가 당신의 수준과 목표에 맞춘 맞춤형 학습 경험을 제공합니다. 
                            초급부터 고급까지, 당신만의 학습 여정을 만들어갑니다.
                        </p>
                    </div>

                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
                        <div class="text-5xl mb-4">🎤</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-3">실시간 피드백</h3>
                        <p class="text-gray-700 leading-relaxed">
                            ElevenLabs 최신 TTS 기술과 정밀한 음성 인식으로 실시간 발음 교정을 받으세요. 
                            정확도, 유창성, 억양까지 세밀하게 분석합니다.
                        </p>
                    </div>

                    <div class="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
                        <div class="text-5xl mb-4">💪</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-3">실전 중심</h3>
                        <p class="text-gray-700 leading-relaxed">
                            타이머 모드, 시나리오 모드, OPIC 스타일 시험으로 실전 감각을 키우세요. 
                            실제 상황에 바로 적용 가능한 실용적 영어를 배웁니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- What You Get Section -->
        <section class="py-16 px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">WorVox와 함께 얻는 것</h2>
                    <p class="text-xl text-gray-600">AI 기술이 선사하는 차별화된 학습 경험</p>
                </div>

                <div class="space-y-8">
                    <!-- Benefit 1 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            🚀
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">빠른 실력 향상</h3>
                            <p class="text-gray-700 leading-relaxed">
                                AI가 당신의 약점을 정확히 파악하고 집중 학습 계획을 제시합니다. 
                                일반적인 학습보다 3배 빠른 속도로 발음과 유창성이 개선됩니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">정확한 발음 분석</span>
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">맞춤형 피드백</span>
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">즉각적인 교정</span>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 2 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            💡
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">자신감 있는 영어 구사</h3>
                            <p class="text-gray-700 leading-relaxed">
                                실전 시나리오와 반복 연습으로 자연스러운 영어 대화 능력을 키웁니다. 
                                실제 상황에서 당황하지 않고 자신감 있게 말할 수 있게 됩니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">실전 시나리오</span>
                                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">OPIC 준비</span>
                                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">회화 연습</span>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 3 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            ⏰
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">시간과 비용 절약</h3>
                            <p class="text-gray-700 leading-relaxed">
                                24시간 언제 어디서나 학습 가능하며, 일반 영어 학원 비용의 1/10 수준입니다. 
                                출퇴근 시간, 점심 시간에도 효과적으로 영어 실력을 쌓으세요.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">월 19,000원부터</span>
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">24시간 이용</span>
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">무제한 연습</span>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 4 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            📊
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">데이터 기반 학습 관리</h3>
                            <p class="text-gray-700 leading-relaxed">
                                학습 진도, 발음 개선 추이, 취약점 분석 등 상세한 리포트로 내 성장을 눈으로 확인하세요. 
                                AI가 제안하는 다음 학습 단계로 효율적인 성장이 가능합니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">상세 분석</span>
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">진도 추적</span>
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">성장 리포트</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Technology Section -->
        <section class="py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">최첨단 AI 기술</h2>
                    <p class="text-xl text-gray-600">세계 최고 수준의 AI 기술로 구축된 학습 플랫폼</p>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-brain text-2xl text-purple-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">GPT-4 언어 모델</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            OpenAI의 최신 GPT-4 모델로 자연스러운 대화와 정확한 피드백을 제공합니다. 
                            문맥을 이해하고 수준에 맞는 답변을 생성합니다.
                        </p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-microphone text-2xl text-blue-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">ElevenLabs TTS</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            세계 최고 수준의 음성 합성 기술로 원어민 수준의 자연스러운 발음을 들려드립니다. 
                            감정과 억양까지 살아있는 음성으로 학습하세요.
                        </p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-wave-square text-2xl text-green-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">실시간 음성 인식</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            정밀한 STT(Speech-to-Text) 기술로 당신의 발음을 실시간 분석합니다. 
                            정확도, 유창성, 억양을 객관적으로 평가합니다.
                        </p>
                    </div>

                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-chart-line text-2xl text-orange-600"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900">맞춤형 학습 알고리즘</h3>
                        </div>
                        <p class="text-gray-700 leading-relaxed">
                            머신러닝 기반 알고리즘이 당신의 학습 패턴을 분석하고 최적화된 학습 경로를 제시합니다. 
                            효율적인 학습으로 빠른 성장을 보장합니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                    지금 바로 시작하세요
                </h2>
                <p class="text-xl text-purple-100 mb-8">
                    2주 무료 체험으로 WorVox의 모든 기능을 경험해보세요
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/" class="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">
                        <i class="fas fa-rocket mr-2"></i>무료 체험 시작
                    </a>
                    <a href="/pricing" class="bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-800 transition transform hover:scale-105 shadow-xl border-2 border-white/30">
                        <i class="fas fa-tag mr-2"></i>요금제 보기
                    </a>
                </div>
                <p class="text-purple-200 mt-6">
                    💳 신용카드 등록 없이 바로 시작 • ✨ 언제든 취소 가능
                </p>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-gray-300 py-12 px-4">
            <div class="max-w-6xl mx-auto text-center">
                <div class="mb-6">
                    <span class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">WorVox</span>
                </div>
                <p class="mb-4">AI 기반 영어 학습의 새로운 기준</p>
                <p class="text-sm text-gray-500">
                    © 2026 WorVox. All rights reserved.
                </p>
                <div class="mt-6 flex justify-center gap-6">
                    <a href="/" class="hover:text-purple-400 transition">홈</a>
                    <a href="/about" class="hover:text-purple-400 transition">소개</a>
                    <a href="/pricing" class="hover:text-purple-400 transition">요금제</a>
                </div>
            </div>
        </footer>

        <!-- Google Analytics -->
        <script>
          gtag('event', 'page_view', {
            page_title: 'About Page',
            page_location: window.location.href,
            page_path: window.location.pathname
          });
        </script>
    </body>
    </html>
  `);
});

// Pricing page - Standalone pricing information
app.get('/pricing', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7');
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <meta name="theme-color" content="#a855f7">
        <title>요금제 - WorVox AI 영어 학습</title>
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="WorVox 요금제 안내. Core 플랜 월 9,900원, Premium 플랜 월 19,000원. 2주 무료 체험으로 시작하세요. AI 영어 학습, 발음 교정, OPIC 준비까지 모두 가능합니다.">
        <meta name="keywords" content="WorVox 요금제, AI 영어 학습 가격, 영어 학습 구독, 영어 앱 가격, OPIC 준비 비용, 영어 회화 가격">
        <meta name="robots" content="index, follow">
        
        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://worvox.com/pricing">
        <meta property="og:title" content="요금제 - WorVox AI 영어 학습">
        <meta property="og:description" content="Core 플랜 월 9,900원, Premium 플랜 월 19,000원. 2주 무료 체험으로 AI 영어 학습을 시작하세요.">
        <meta property="og:image" content="https://worvox.com/logo.png">
        
        <link rel="canonical" href="https://worvox.com/pricing">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- JSON-LD for Pricing -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "WorVox Premium",
          "description": "AI 기반 영어 학습 플랫폼 프리미엄 플랜",
          "brand": {
            "@type": "Brand",
            "name": "WorVox"
          },
          "offers": [
            {
              "@type": "Offer",
              "name": "Core 월간",
              "price": "9900",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing"
            },
            {
              "@type": "Offer",
              "name": "Premium 월간",
              "price": "19000",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing"
            },
            {
              "@type": "Offer",
              "name": "Core 연간",
              "price": "97416",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing"
            },
            {
              "@type": "Offer",
              "name": "Premium 연간",
              "price": "186960",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing"
            }
          ]
        }
        </script>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <!-- Navigation -->
        <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <a href="/" class="flex items-center space-x-2">
                        <img src="/static/logo.webp" alt="WorVox Logo" class="h-8 w-8">
                        <span class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">WorVox</span>
                    </a>
                    <div class="flex items-center gap-4">
                        <a href="/about" class="text-gray-700 hover:text-purple-600 font-medium transition">
                            <i class="fas fa-info-circle mr-2"></i>소개
                        </a>
                        <a href="/" class="text-gray-700 hover:text-purple-600 font-medium transition">
                            <i class="fas fa-home mr-2"></i>홈
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="pt-20 pb-16 px-4">
            <div class="max-w-4xl mx-auto text-center">
                <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                    <span class="bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                        간단하고 명확한 요금제
                    </span>
                </h1>
                <p class="text-xl text-gray-600 mb-4">
                    2주 무료 체험으로 시작하세요
                </p>
                <p class="text-gray-500">
                    💳 신용카드 등록 없이 바로 시작 • ✨ 언제든 취소 가능
                </p>
            </div>
        </section>

        <!-- Pricing Cards -->
        <section class="py-16 px-4">
            <div class="max-w-6xl mx-auto">
                <div class="grid md:grid-cols-3 gap-8 mb-12">
                    <!-- Free Plan -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                        <div class="text-center mb-6">
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                            <div class="text-4xl font-bold text-gray-900 mb-2">₩0</div>
                            <p class="text-gray-600">무료 체험</p>
                        </div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700">AI 대화 5회/일</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700">발음 연습 10회/일</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700">단어 검색 10회/일</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-times text-gray-400 mt-1"></i>
                                <span class="text-gray-400">타이머 모드 ❌</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-times text-gray-400 mt-1"></i>
                                <span class="text-gray-400">시나리오 모드 ❌</span>
                            </li>
                        </ul>
                        <a href="/" class="block w-full bg-gray-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-700 transition">
                            체험 시작
                        </a>
                    </div>

                    <!-- Core Plan -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-500">
                        <div class="text-center mb-6">
                            <div class="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold mb-2">
                                인기
                            </div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">Core</h3>
                            <div class="text-4xl font-bold text-gray-900 mb-2">₩9,900</div>
                            <p class="text-gray-600">월 / 연 ₩97,416 (18% 할인)</p>
                        </div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700"><strong>무제한</strong> AI 대화</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700"><strong>무제한</strong> 발음 연습</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700">타이머 모드 30회/일</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700">시나리오 모드 30회/일</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-green-600 mt-1"></i>
                                <span class="text-gray-700">시험 모드 10회/일</span>
                            </li>
                        </ul>
                        <a href="/" class="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                            시작하기
                        </a>
                    </div>

                    <!-- Premium Plan -->
                    <div class="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 border-2 border-purple-500 text-white transform scale-105">
                        <div class="text-center mb-6">
                            <div class="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                                💎 추천
                            </div>
                            <h3 class="text-2xl font-bold mb-2">Premium</h3>
                            <div class="text-4xl font-bold mb-2">₩19,000</div>
                            <p class="text-purple-100">월 / 연 ₩186,960 (18% 할인)</p>
                        </div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-yellow-300 mt-1"></i>
                                <span><strong>모든 Core 기능</strong></span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-yellow-300 mt-1"></i>
                                <span><strong>무제한</strong> 모든 모드 이용</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-yellow-300 mt-1"></i>
                                <span><strong>AI 상세 분석</strong> 리포트</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-yellow-300 mt-1"></i>
                                <span><strong>개선 답변 예시</strong> 생성</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-yellow-300 mt-1"></i>
                                <span><strong>무제한</strong> AI 프롬프트</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-yellow-300 mt-1"></i>
                                <span>개인화 학습 경로</span>
                            </li>
                        </ul>
                        <a href="/" class="block w-full bg-white text-purple-600 text-center py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                            Premium 시작
                        </a>
                    </div>
                </div>

                <!-- Feature Comparison Table -->
                <div class="bg-white rounded-2xl shadow-lg p-8">
                    <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">기능 비교</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b-2 border-gray-200">
                                    <th class="text-left py-4 px-4 font-semibold text-gray-900">기능</th>
                                    <th class="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                                    <th class="text-center py-4 px-4 font-semibold text-blue-600">Core</th>
                                    <th class="text-center py-4 px-4 font-semibold text-purple-600">Premium</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">AI 실시간 대화</td>
                                    <td class="text-center py-4 px-4 text-gray-600">5회/일</td>
                                    <td class="text-center py-4 px-4 text-blue-600">무제한</td>
                                    <td class="text-center py-4 px-4 text-purple-600">무제한</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">발음 교정 연습</td>
                                    <td class="text-center py-4 px-4 text-gray-600">10회/일</td>
                                    <td class="text-center py-4 px-4 text-blue-600">무제한</td>
                                    <td class="text-center py-4 px-4 text-purple-600">무제한</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">타이머 모드</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-blue-600">30회/일</td>
                                    <td class="text-center py-4 px-4 text-purple-600">무제한</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">시나리오 모드</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-blue-600">30회/일</td>
                                    <td class="text-center py-4 px-4 text-purple-600">무제한</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">OPIC 스타일 시험</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-blue-600">10회/일</td>
                                    <td class="text-center py-4 px-4 text-purple-600">무제한</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">AI 상세 분석 리포트</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-purple-600">✅</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">개선 답변 예시</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-purple-600">✅</td>
                                </tr>
                                <tr class="border-b border-gray-100">
                                    <td class="py-4 px-4 text-gray-700">AI 프롬프트 생성</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-gray-400">❌</td>
                                    <td class="text-center py-4 px-4 text-purple-600">✅</td>
                                </tr>
                                <tr>
                                    <td class="py-4 px-4 text-gray-700">학습 기록 보관</td>
                                    <td class="text-center py-4 px-4 text-gray-600">7일</td>
                                    <td class="text-center py-4 px-4 text-blue-600">30일</td>
                                    <td class="text-center py-4 px-4 text-purple-600">무제한</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="py-16 px-4 bg-white">
            <div class="max-w-4xl mx-auto">
                <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">자주 묻는 질문</h2>
                <div class="space-y-4">
                    <details class="bg-gray-50 rounded-lg p-6">
                        <summary class="font-semibold text-gray-900 cursor-pointer">무료 체험은 어떻게 이용하나요?</summary>
                        <p class="mt-3 text-gray-600">회원가입 후 자동으로 2주 무료 체험이 시작됩니다. 신용카드 등록 없이 바로 이용 가능합니다.</p>
                    </details>
                    <details class="bg-gray-50 rounded-lg p-6">
                        <summary class="font-semibold text-gray-900 cursor-pointer">언제든 취소할 수 있나요?</summary>
                        <p class="mt-3 text-gray-600">네, 언제든 내 정보 페이지에서 구독을 취소할 수 있습니다. 남은 기간까지는 계속 이용 가능합니다.</p>
                    </details>
                    <details class="bg-gray-50 rounded-lg p-6">
                        <summary class="font-semibold text-gray-900 cursor-pointer">연간 요금제의 혜택은 무엇인가요?</summary>
                        <p class="mt-3 text-gray-600">연간 요금제는 월간 대비 18% 할인된 가격으로 이용하실 수 있습니다. Core는 ₩21,384, Premium은 ₩41,040을 절약할 수 있습니다.</p>
                    </details>
                    <details class="bg-gray-50 rounded-lg p-6">
                        <summary class="font-semibold text-gray-900 cursor-pointer">플랜 변경은 어떻게 하나요?</summary>
                        <p class="mt-3 text-gray-600">내 정보 페이지에서 언제든 플랜을 변경할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드 시 현재 기간 종료 후 적용됩니다.</p>
                    </details>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                    지금 바로 시작하세요
                </h2>
                <p class="text-xl text-purple-100 mb-8">
                    2주 무료 체험으로 WorVox의 모든 기능을 경험해보세요
                </p>
                <a href="/" class="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">
                    <i class="fas fa-rocket mr-2"></i>무료 체험 시작
                </a>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-gray-300 py-12 px-4">
            <div class="max-w-6xl mx-auto text-center">
                <div class="mb-6">
                    <span class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">WorVox</span>
                </div>
                <p class="mb-4">AI 기반 영어 학습의 새로운 기준</p>
                <p class="text-sm text-gray-500">
                    © 2026 WorVox. All rights reserved.
                </p>
                <div class="mt-6 flex justify-center gap-6">
                    <a href="/" class="hover:text-purple-400 transition">홈</a>
                    <a href="/about" class="hover:text-purple-400 transition">소개</a>
                    <a href="/pricing" class="hover:text-purple-400 transition">요금제</a>
                </div>
            </div>
        </footer>

        <!-- Google Analytics -->
        <script>
          gtag('event', 'page_view', {
            page_title: 'Pricing Page',
            page_location: window.location.href,
            page_path: window.location.pathname
          });
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

// App page - Main application for logged users
app.get('/app', (c) => {
  // Force COMPLETE cache busting - change this number to force refresh
  const FORCE_VERSION = '20260226-billing-toggle-v1';
  const version = `${FORCE_VERSION}-${Date.now()}`;
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <!-- Google tag (gtag.js) - MUST BE FIRST -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7', {
            'send_page_view': true
          });
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <meta name="theme-color" content="#a855f7">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>WorVox - AI 영어 학습 플랫폼</title>
        
        <meta name="robots" content="noindex, nofollow">
        
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
        
        <!-- Preconnect to CDNs for faster loading -->
        <link rel="preconnect" href="https://cdn.tailwindcss.com">
        <link rel="preconnect" href="https://cdn.jsdelivr.net">
        <link rel="preconnect" href="https://www.googletagmanager.com">
        <link rel="dns-prefetch" href="https://js.tosspayments.com">
        <link rel="dns-prefetch" href="https://accounts.google.com">
        
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
        <script src="/static/app.min.js?v=${version}"></script>
    </body>
    </html>
  `);
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
        <!-- Google tag (gtag.js) - MUST BE FIRST -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-1W0YMPPVH7"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1W0YMPPVH7', {
            'send_page_view': true
          });
        </script>
        
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <meta name="theme-color" content="#a855f7">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <title>WorVox - AI 영어 학습 플랫폼 | 실시간 발음 교정 & 맞춤형 학습</title>
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="WorVox는 AI 기반 영어 학습 플랫폼으로 실시간 발음 교정, ElevenLabs TTS 음성 합성, GPT-4 기반 맞춤형 대화 연습을 제공합니다. 타이머 모드로 즉각적인 발음 피드백, 시나리오 모드로 실전 회화 연습, OPIC 스타일 시험 모드로 실력 평가까지. 2주 무료 체험으로 AI 영어 코치와 함께 시작하세요.">
        <meta name="keywords" content="영어 학습, AI 영어, 발음 교정, 영어 회화, OPIC, OPIC 준비, 영어 스피킹, 영어 공부, 온라인 영어, AI 튜터, AI 영어 코치, 실시간 발음 분석, 영어 말하기, TTS, STT, 음성 인식, 영어 시험, 발음 연습, 유창성 향상, 영어 문법, 어휘 학습">
        <meta name="author" content="WorVox Team">
        <meta name="robots" content="index, follow">
        <meta name="language" content="Korean">
        <meta name="geo.region" content="KR">
        <meta name="geo.placename" content="South Korea">
        
        <!-- Open Graph (Facebook, LinkedIn) -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://worvox.com">
        <meta property="og:title" content="WorVox - AI 영어 학습 플랫폼 | 실시간 발음 교정 & 맞춤형 학습">
        <meta property="og:description" content="AI 기반 실시간 발음 교정과 맞춤형 학습으로 영어 실력 향상. 타이머/시나리오/OPIC 시험 모드 제공. 월 19,000원부터, 2주 무료 체험.">
        <meta property="og:image" content="https://worvox.com/logo.png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="WorVox - AI 영어 학습">
        <meta property="og:locale" content="ko_KR">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="https://worvox.com">
        <meta name="twitter:title" content="WorVox - AI 영어 학습 플랫폼">
        <meta name="twitter:description" content="AI 기반 실시간 발음 교정과 맞춤형 학습으로 영어 실력 향상. 월 19,000원, 2주 무료 체험">
        <meta name="twitter:image" content="https://worvox.com/logo.png">
        
        <!-- JSON-LD Structured Data for Google -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "WorVox",
          "alternateName": "워복스",
          "url": "https://worvox.com",
          "logo": "https://worvox.com/logo.png",
          "description": "AI 기반 영어 학습 플랫폼. 실시간 발음 교정, ElevenLabs TTS, GPT-4 맞춤형 대화 연습 제공.",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR"
          },
          "sameAs": [
            "https://worvox.com"
          ],
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "KRW",
            "lowPrice": "19000",
            "highPrice": "174240",
            "offerCount": "2"
          },
          "areaServed": "KR",
          "availableLanguage": ["ko", "en"]
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "WorVox",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "19000",
            "priceCurrency": "KRW",
            "priceValidUntil": "2026-12-31",
            "availability": "https://schema.org/InStock",
            "url": "https://worvox.com"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "127",
            "bestRating": "5",
            "worstRating": "1"
          },
          "description": "AI 영어 학습 플랫폼 - 실시간 발음 교정, 맞춤형 대화 연습, OPIC 스타일 시험",
          "screenshot": "https://worvox.com/logo.png",
          "creator": {
            "@type": "Organization",
            "name": "WorVox Team"
          }
        }
        </script>
        
        <!-- Canonical URL -->
        <link rel="canonical" href="https://worvox.com">
        
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
        
        <!-- Preconnect to CDNs for faster loading -->
        <link rel="preconnect" href="https://cdn.tailwindcss.com">
        <link rel="preconnect" href="https://cdn.jsdelivr.net">
        <link rel="preconnect" href="https://www.googletagmanager.com">
        <link rel="dns-prefetch" href="https://js.tosspayments.com">
        <link rel="dns-prefetch" href="https://accounts.google.com">
        
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
          
          // Conditional routing: Show landing page for non-logged users
          (function() {
            const currentUser = localStorage.getItem('currentUser');
            
            // If not logged in, redirect to landing page
            if (!currentUser) {
              window.location.href = '/landing';
            }
          })();
        </script>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="/static/gamification.js?v=${version}"></script>
        <script src="/static/app.min.js?v=${version}"></script>
    </body>
    </html>
  `, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
});

// Export both app and scheduled job
export default {
  fetch: app.fetch,
  scheduled: scheduled.scheduled
};
