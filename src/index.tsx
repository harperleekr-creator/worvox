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
import rewards from './routes/rewards';
import usage from './routes/usage';
import analysis from './routes/analysis';
import payments from './routes/payments';
import admin from './routes/admin';
import attendance from './routes/attendance';
import pronunciationAnalysis from './routes/pronunciation-analysis';
import modeReports from './routes/mode-reports';
import aiPrompts from './routes/ai-prompts';
import emailNotifications from './routes/email-notifications';
import emails from './routes/emails';
import hiing from './routes/hiing';
import dailyGoals from './routes/daily-goals';
import notifications from './routes/notifications';
import scheduled from './scheduled';

// Cache busting version - update this when deploying new code
const APP_VERSION = '20260315-cache-fix';
const BUILD_TIME = '1774326782834'; // Update manually or via build script

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

// Serve static files with proper cache headers
app.use('/static/*', serveStatic({ root: './public' }));

// Override cache headers after serveStatic
app.use('/static/*', async (c, next) => {
  await next();
  
  const url = new URL(c.req.url);
  const hasVersion = url.searchParams.has('v') || /\.[a-f0-9]{8,}\.(js|css)/.test(url.pathname);
  
  if (hasVersion) {
    // Versioned files - cache for 1 year (immutable)
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    c.header('Surrogate-Control', 'max-age=31536000'); // For Cloudflare
  } else {
    // Non-versioned files - no cache
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
    c.header('Surrogate-Control', 'no-store'); // For Cloudflare
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }
});

// Serve favicon files directly (no path prefix)
app.use('/favicon.ico', serveStatic({ root: './' }));
app.use('/favicon-*', serveStatic({ root: './' }));
app.use('/apple-touch-icon.png', serveStatic({ root: './' }));
app.use('/android-chrome-*', serveStatic({ root: './' }));
app.use('/logo.png', serveStatic({ root: './' }));

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
app.route('/api/rewards', rewards);
app.route('/api/usage', usage);
app.route('/api/analysis', analysis);
app.route('/api/payments', payments);
app.route('/api/admin', admin);
app.route('/api/attendance', attendance);
app.route('/api/pronunciation', pronunciationAnalysis);
app.route('/api/mode-reports', modeReports);
app.route('/api/ai-prompts', aiPrompts);
app.route('/api/email-notifications', emailNotifications);
app.route('/api/emails', emails);
app.route('/api/hiing', hiing);
app.route('/api/daily-goals', dailyGoals);
app.route('/api/notifications', notifications);

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
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
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
                // Check if this is a Live Speaking purchase
                const isLiveSpeaking = orderId.includes('Live_Speaking') || orderId.includes('live_speaking');
                const redirectUrl = isLiveSpeaking ? '/app?view=teacher-selection' : '/app';
                
                document.body.innerHTML = \`
                  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                      <div class="text-6xl mb-4">🎉</div>
                      <h1 class="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h1>
                      <p class="text-gray-600 mb-6">결제가 성공적으로 완료되었습니다.</p>
                      \${isLiveSpeaking ? '<p class="text-blue-600 font-semibold mb-4">이제 강사를 선택하세요!</p>' : ''}
                      <button 
                        onclick="window.location.href='${redirectUrl}'"
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        \${isLiveSpeaking ? '강사 선택하기' : '홈으로 돌아가기'}
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
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
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
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
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
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
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
  const lang = c.req.query('lang') || 'ko'; // Default to Korean
  const isKorean = lang === 'ko';
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="${isKorean ? 'ko' : 'en'}">
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
        <title>${isKorean ? 'WorVox | AI 영어 스피킹 플랫폼 - 실시간 발음 교정 & 맞춤형 회화 연습' : 'WorVox | AI English Speaking Platform - Real-time Pronunciation Correction & Personalized Practice'}</title>
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="${isKorean ? 'WorVox AI 영어 스피킹 플랫폼 - GPT-4 기반 실시간 발음 교정, ElevenLabs TTS 음성 합성, 30가지 실전 시나리오로 영어 회화 실력 3배 향상. 월 1.9만원으로 24시간 무제한 학습. 2주 무료 체험 시작!' : 'WorVox AI English Speaking Platform - GPT-4 based real-time pronunciation correction, ElevenLabs TTS voice synthesis, 30 practical scenarios to improve your English conversation skills 3x faster. 24/7 unlimited learning for $15/month. Start 2-week free trial!'}">
        <meta name="keywords" content="${isKorean ? 'AI 영어 학습, 영어 발음 교정, 영어 회화 연습, OPIC 준비, 영어 말하기, GPT-4 영어, ElevenLabs, 실시간 피드백, 영어 학원 대체, 온라인 영어 과외, AI 영어 코치, 영어 공부 앱, 영어 스피킹, 발음 분석, 맞춤형 영어 학습' : 'AI English learning, pronunciation correction, conversation practice, OPIC prep, speaking English, GPT-4 English, ElevenLabs, real-time feedback, online English tutor, AI English coach, English study app, speaking practice, pronunciation analysis, personalized learning'}">
        <meta name="robots" content="index, follow">
        
        <!-- Open Graph -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://worvox.com">
        <meta property="og:title" content="${isKorean ? 'WorVox - AI 영어 스피킹 플랫폼 | 실시간 발음 교정 & 회화 연습' : 'WorVox - AI English Speaking Platform | Real-time Pronunciation Correction'}">
        <meta property="og:description" content="${isKorean ? 'GPT-4 기반 AI로 영어 회화 실력 3배 향상! 실시간 발음 교정, 30가지 실전 시나리오, OPIC 준비. 월 1.9만원, 2주 무료 체험!' : 'Improve your English conversation skills 3x faster with GPT-4 AI! Real-time pronunciation correction, 30 practical scenarios, OPIC prep. $15/month, 2-week free trial!'}">
        <meta property="og:image" content="https://worvox.com/logo.png">
        
        <link rel="canonical" href="https://worvox.com">
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          // Configure Tailwind for dark mode
          tailwind.config = {
            darkMode: 'class'
          }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <!-- Navigation -->
        <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <a href="/landing?lang=${isKorean ? 'ko' : 'en'}" class="flex items-center space-x-1 sm:space-x-2">
                        <img src="/static/logo.webp" alt="WorVox Logo" class="h-6 w-6 sm:h-8 sm:w-8">
                        <span class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">WorVox</span>
                    </a>
                    <div class="flex items-center gap-2 sm:gap-4">
                        <a href="/landing?lang=${isKorean ? 'en' : 'ko'}" class="flex items-center gap-1 text-gray-700 hover:text-purple-600 font-medium transition text-sm border-2 border-purple-200 hover:border-purple-400 rounded-lg px-3 py-1.5">
                            <i class="fas fa-globe"></i>
                            <span>${isKorean ? 'ENG' : 'KOR'}</span>
                        </a>
                        <a href="/pricing" class="text-gray-700 hover:text-purple-600 font-medium transition text-sm sm:text-base">
                            <i class="fas fa-tag mr-1 sm:mr-2"></i><span class="hidden xs:inline">${isKorean ? '요금제' : 'Pricing'}</span><span class="xs:hidden">${isKorean ? '요금' : 'Price'}</span>
                        </a>
                        <a href="/app" class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105 text-sm sm:text-base whitespace-nowrap">
                            <i class="fas fa-sign-in-alt mr-1 sm:mr-2"></i><span class="hidden sm:inline">${isKorean ? '로그인 / 시작하기' : 'Login / Get Started'}</span><span class="sm:hidden">${isKorean ? '로그인' : 'Login'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="pt-24 sm:pt-28 md:pt-32 pb-16 px-4">
            <div class="max-w-4xl mx-auto text-center">
                <!-- Quick Identity Badge -->
                <div class="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-pulse">
                    <span class="text-lg">🎯</span>
                    <span>${isKorean ? '영어 말하기가 두려운 당신을 위한' : 'For Those Who Fear Speaking English'}</span>
                </div>
                
                <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    <span class="bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                        ${isKorean ? 'AI 영어 스피킹 플랫폼' : 'AI English Speaking Platform'}
                    </span>
                    <br/>
                    <span class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">${isKorean ? '실시간 발음 교정 & 맞춤형 회화 연습' : 'Real-time Pronunciation & Personalized Practice'}</span>
                </h1>
                <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed px-2">
                    ${isKorean 
                      ? 'GPT-4 기반 AI로 <strong>영어 회화 실력 3배 향상</strong>!<br class="hidden sm:block"/><span class="block sm:inline">실시간 발음 분석, 30가지 실전 시나리오,</span><span class="block sm:inline">OPIC 준비까지 - 월 1.9만원</span>'
                      : 'Improve your <strong>English conversation skills 3x faster</strong> with GPT-4 AI!<br class="hidden sm:block"/><span class="block sm:inline">Real-time pronunciation analysis, 30 practical scenarios,</span><span class="block sm:inline">OPIC prep - $15/month</span>'
                    }
                </p>
                
                <!-- Social Proof -->
                <div class="flex flex-wrap justify-center gap-4 mb-8 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-500">★★★★★</span>
                        <span class="font-semibold">4.8/5</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-users text-purple-600"></i>
                        <span>3,000+ 학습자</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-clock text-blue-600"></i>
                        <span>평균 30일 만에 효과</span>
                    </div>
                </div>

                <a href="/app" 
                   class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition transform hover:scale-105"
                   onclick="gtag('event', 'cta_click', { 'event_category': 'engagement', 'event_label': 'hero_cta_start_trial', 'value': 1 })">
                    <i class="fas fa-rocket mr-2"></i>${isKorean ? '2주 무료 체험 시작' : 'Start 2-Week Free Trial'}
                </a>
                <p class="mt-4 text-sm text-gray-500">
                    <i class="fas fa-check-circle text-green-600 mr-1"></i>${isKorean ? '신용카드 등록 없이 바로 시작' : 'No credit card required'}
                </p>
            </div>
        </section>

        <!-- Quick Target Audience (3초 안에 이해) -->
        <section class="py-12 px-4 bg-white border-b-4 border-purple-200">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-8">
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        <span class="text-purple-600">이런 분들</span>을 위해 만들었어요
                    </h2>
                    <p class="text-gray-600">3초 만에 확인하세요 - 당신을 위한 솔루션인가요?</p>
                </div>

                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Target 1: 영어 말문 막힘 -->
                    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center hover:shadow-lg transition transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-red-300">
                        <div class="text-5xl mb-3">😰</div>
                        <div class="font-bold text-gray-900 mb-2">영어만 들으면<br/>말문이 막혀요</div>
                        <div class="text-sm text-gray-600 mb-3">"무슨 말을 해야 할지<br/>생각이 안 나요"</div>
                        <div class="inline-block bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
                            ✓ WorVox로 해결
                        </div>
                    </div>

                    <!-- Target 2: 발음 자신 없음 -->
                    <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center hover:shadow-lg transition transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-orange-300">
                        <div class="text-5xl mb-3">🤐</div>
                        <div class="font-bold text-gray-900 mb-2">발음이 창피해서<br/>말을 못해요</div>
                        <div class="text-sm text-gray-600 mb-3">"틀린 발음으로<br/>말하기 두려워요"</div>
                        <div class="inline-block bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                            ✓ WorVox로 해결
                        </div>
                    </div>

                    <!-- Target 3: 시험 준비 -->
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center hover:shadow-lg transition transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-300">
                        <div class="text-5xl mb-3">📝</div>
                        <div class="font-bold text-gray-900 mb-2">OPIC/토스<br/>고득점 필요해요</div>
                        <div class="text-sm text-gray-600 mb-3">"실전처럼 연습할<br/>방법이 없어요"</div>
                        <div class="inline-block bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                            ✓ WorVox로 해결
                        </div>
                    </div>

                    <!-- Target 4: 바쁜 직장인 -->
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center hover:shadow-lg transition transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-purple-300">
                        <div class="text-5xl mb-3">⏰</div>
                        <div class="font-bold text-gray-900 mb-2">학원 다닐<br/>시간이 없어요</div>
                        <div class="text-sm text-gray-600 mb-3">"출퇴근 시간에<br/>공부하고 싶어요"</div>
                        <div class="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                            ✓ WorVox로 해결
                        </div>
                    </div>
                </div>

                <!-- Quick Value Prop -->
                <div class="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-center">
                    <div class="flex flex-wrap justify-center items-center gap-3 md:gap-6 text-white">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-check-circle text-yellow-300 text-xl"></i>
                            <span class="font-semibold">24시간 AI 영어 선생님</span>
                        </div>
                        <div class="hidden md:block text-white/50">|</div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-check-circle text-yellow-300 text-xl"></i>
                            <span class="font-semibold">실시간 발음 교정</span>
                        </div>
                        <div class="hidden md:block text-white/50">|</div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-check-circle text-yellow-300 text-xl"></i>
                            <span class="font-semibold">월 1.9만원</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Brand Story Section -->
        <section class="py-16 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-12">
                    <h2 class="text-3xl md:text-5xl font-bold text-white mb-4">
                        Speak Confidently, Master English Fluently
                    </h2>
                    <p class="text-xl md:text-2xl text-white/90 mb-2">
                        One Platform. Complete Mastery.
                    </p>
                    <p class="text-lg text-white/80">
                        WorVox 하나로 영어 말하기 공부의 끝!
                    </p>
                </div>

                <div class="grid md:grid-cols-2 gap-8 mb-12">
                    <!-- Global Team Story -->
                    <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                        <div class="text-5xl mb-4 text-center">🌏</div>
                        <h3 class="text-2xl font-bold text-white mb-4 text-center">Created by Global Educators</h3>
                        <p class="text-white/90 leading-relaxed text-center mb-4">
                            해외 출신 운영진들이 직접 설계한 플랫폼
                        </p>
                        <p class="text-white/80 leading-relaxed">
                            우리는 영어를 유창하게 말하는 것이 얼마나 중요한지 알고 있습니다. 
                            그래서 WorVox를 만들었습니다 - <strong class="text-yellow-300">대화의 힘</strong>을 이해하는 
                            글로벌 교육자들이 최대한 많이 말할 수 있도록 설계한 플랫폼입니다.
                        </p>
                    </div>

                    <!-- Speaking Philosophy -->
                    <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                        <div class="text-5xl mb-4 text-center">💬</div>
                        <h3 class="text-2xl font-bold text-white mb-4 text-center">Built for Fluency</h3>
                        <p class="text-white/90 leading-relaxed text-center mb-4">
                            말을 많이 하면 자신감이 생깁니다
                        </p>
                        <p class="text-white/80 leading-relaxed">
                            어휘와 문법도 공부하지만, <strong class="text-yellow-300">결국 스피킹을 많이 함으로써</strong> 
                            영어에 자신감을 가질 수 있습니다. 다양한 시나리오와 즉각적인 피드백으로 
                            <strong class="text-yellow-300">실전 대화 능력</strong>을 키우세요.
                        </p>
                    </div>
                </div>

                <!-- Key Features Grid -->
                <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                        <div class="text-3xl mb-2">🎬</div>
                        <div class="font-bold text-white text-lg mb-1">30+ Scenarios</div>
                        <div class="text-white/80 text-sm">실생활 모든 상황 연습</div>
                    </div>
                    <div class="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                        <div class="text-3xl mb-2">⚡</div>
                        <div class="font-bold text-white text-lg mb-1">Instant Feedback</div>
                        <div class="text-white/80 text-sm">즉각적인 AI 피드백</div>
                    </div>
                    <div class="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                        <div class="text-3xl mb-2">📈</div>
                        <div class="font-bold text-white text-lg mb-1">Track Progress</div>
                        <div class="text-white/80 text-sm">성장 과정 추적</div>
                    </div>
                    <div class="bg-white/10 rounded-xl p-6 text-center backdrop-blur-sm">
                        <div class="text-3xl mb-2">🎯</div>
                        <div class="font-bold text-white text-lg mb-1">No Fear</div>
                        <div class="text-white/80 text-sm">두려움 없이 연습</div>
                    </div>
                </div>

                <!-- Bottom Message -->
                <div class="mt-12 text-center">
                    <div class="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 inline-block">
                        <p class="text-2xl md:text-3xl font-bold text-white mb-3">
                            "Fluency comes from conversation, not textbooks"
                        </p>
                        <p class="text-lg text-white/90">
                            유창함은 교과서가 아닌 대화에서 나옵니다
                        </p>
                    </div>
                </div>
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

                    <!-- Benefit 5 - Vocabulary Learning -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-start gap-6">
                        <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl text-white">
                            📚
                        </div>
                        <div class="flex-1">
                            <h3 class="text-2xl font-bold text-gray-900 mb-3">체계적인 단어 학습</h3>
                            <p class="text-gray-700 leading-relaxed">
                                난이도별 단어장(초급/중급/고급)과 TOEIC 필수 단어를 플래시카드와 퀴즈로 재미있게 학습하세요. 
                                북마크 기능으로 약한 단어를 집중 복습하고, 학습 진도를 실시간으로 추적할 수 있습니다.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">플래시카드</span>
                                <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">퀴즈 모드</span>
                                <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">북마크</span>
                                <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">진도 추적</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Results-Focused Benefits Section -->
        <section class="py-16 px-4 bg-white">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                        <i class="fas fa-star mr-2"></i>실제 변화
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        WorVox가 바꾸는 3가지
                    </h2>
                    <p class="text-xl text-gray-600">학습자들이 경험하는 실질적인 변화</p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Benefit 1: 말문이 트임 -->
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition transform hover:-translate-y-2">
                        <div class="text-6xl mb-6 text-center">💬</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">말문이 트임</h3>
                        <p class="text-gray-700 leading-relaxed text-center mb-6">
                            "무슨 말을 해야 할지 몰라 멈추는 시간이 줄어듭니다."
                        </p>
                        <div class="bg-white rounded-xl p-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-600">학습 전</span>
                                <span class="text-sm font-bold text-red-600">3초+ 멈춤</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div class="bg-red-500 h-2 rounded-full" style="width: 30%"></div>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-600">학습 후</span>
                                <span class="text-sm font-bold text-green-600">즉시 응답</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full" style="width: 90%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 2: 발음이 정리됨 -->
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition transform hover:-translate-y-2">
                        <div class="text-6xl mb-6 text-center">🎯</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">발음이 정리됨</h3>
                        <p class="text-gray-700 leading-relaxed text-center mb-6">
                            "틀린 발음을 그 자리에서 잡아, 나쁜 습관을 쌓지 않습니다."
                        </p>
                        <div class="bg-white rounded-xl p-4">
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm">실시간 교정</span>
                                    <i class="fas fa-check-circle text-green-600"></i>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm">정확도 분석</span>
                                    <i class="fas fa-check-circle text-green-600"></i>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm">억양 피드백</span>
                                    <i class="fas fa-check-circle text-green-600"></i>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm">유창성 측정</span>
                                    <i class="fas fa-check-circle text-green-600"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Benefit 3: 표현이 자연스러워짐 -->
                    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition transform hover:-translate-y-2">
                        <div class="text-6xl mb-6 text-center">✨</div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">표현이 자연스러워짐</h3>
                        <p class="text-gray-700 leading-relaxed text-center mb-6">
                            "같은 의미라도 더 자연스러운 표현으로 업그레이드됩니다."
                        </p>
                        <div class="bg-white rounded-xl p-4">
                            <div class="space-y-4">
                                <div>
                                    <div class="text-xs text-red-600 mb-1">❌ 어색한 표현</div>
                                    <div class="text-sm text-gray-600 line-through">"I want to say..."</div>
                                </div>
                                <div class="border-t pt-4">
                                    <div class="text-xs text-green-600 mb-1">✅ 자연스러운 표현</div>
                                    <div class="text-sm font-semibold text-gray-900">"I'd like to mention..."</div>
                                </div>
                                <div class="text-xs text-center text-gray-500 bg-green-50 rounded-lg py-2">
                                    AI가 더 나은 표현 제안
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Use Cases Section (Target Audience) -->
        <section class="py-16 px-4 bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                        <i class="fas fa-users mr-2"></i>타겟별 솔루션
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        이런 분들에게 특히 잘 맞아요
                    </h2>
                    <p class="text-xl text-gray-600">당신의 목표에 딱 맞는 학습 시나리오</p>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Use Case 1: 직장인 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition border-2 border-purple-100">
                        <div class="flex items-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mr-4">
                                💼
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900">직장인</h3>
                                <p class="text-sm text-gray-600">업무 영어 완벽 대응</p>
                            </div>
                        </div>
                        <div class="space-y-3 mb-6">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-purple-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">화상 미팅</div>
                                    <div class="text-sm text-gray-600">해외 파트너와의 실시간 커뮤니케이션</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-purple-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">영문 이메일</div>
                                    <div class="text-sm text-gray-600">비즈니스 상황별 이메일 작성법</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-purple-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">전화 응대</div>
                                    <div class="text-sm text-gray-600">긴급 전화 상황 대응 연습</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-4">
                            <div class="text-sm text-purple-900 font-semibold mb-2">
                                <i class="fas fa-lightbulb mr-2"></i>추천 모드
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-white text-purple-700 rounded-full text-xs font-medium">시나리오 모드</span>
                                <span class="px-3 py-1 bg-white text-purple-700 rounded-full text-xs font-medium">AI 대화</span>
                            </div>
                        </div>
                    </div>

                    <!-- Use Case 2: OPIC 준비 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition border-2 border-blue-100">
                        <div class="flex items-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mr-4">
                                🎓
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900">OPIC 준비생</h3>
                                <p class="text-sm text-gray-600">고득점 목표 달성</p>
                            </div>
                        </div>
                        <div class="space-y-3 mb-6">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">롤플레이 연습</div>
                                    <div class="text-sm text-gray-600">15개 주제별 심화 대화 훈련</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">돌발 질문 대비</div>
                                    <div class="text-sm text-gray-600">예측 불가 상황 즉시 응답 연습</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-blue-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">시간 압박 훈련</div>
                                    <div class="text-sm text-gray-600">제한 시간 내 답변 완성도 향상</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-blue-50 rounded-xl p-4">
                            <div class="text-sm text-blue-900 font-semibold mb-2">
                                <i class="fas fa-lightbulb mr-2"></i>추천 모드
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-medium">시험 모드</span>
                                <span class="px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-medium">타이머 모드</span>
                            </div>
                        </div>
                    </div>

                    <!-- Use Case 3: 여행/워홀 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition border-2 border-green-100">
                        <div class="flex items-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl mr-4">
                                ✈️
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900">여행 / 워홀 준비</h3>
                                <p class="text-sm text-gray-600">해외 생활 필수 영어</p>
                            </div>
                        </div>
                        <div class="space-y-3 mb-6">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-green-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">공항 체크인</div>
                                    <div class="text-sm text-gray-600">항공권·수하물 관련 필수 표현</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-green-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">식당 주문</div>
                                    <div class="text-sm text-gray-600">메뉴 선택부터 계산까지</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-green-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">호텔 / 병원</div>
                                    <div class="text-sm text-gray-600">긴급 상황 대응 회화</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-green-50 rounded-xl p-4">
                            <div class="text-sm text-green-900 font-semibold mb-2">
                                <i class="fas fa-lightbulb mr-2"></i>추천 모드
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-white text-green-700 rounded-full text-xs font-medium">시나리오 모드</span>
                                <span class="px-3 py-1 bg-white text-green-700 rounded-full text-xs font-medium">AI 대화</span>
                            </div>
                        </div>
                    </div>

                    <!-- Use Case 4: 영어 울렁증 -->
                    <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition border-2 border-orange-100">
                        <div class="flex items-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl mr-4">
                                💪
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-gray-900">영어 울렁증</h3>
                                <p class="text-sm text-gray-600">자신감 회복 프로그램</p>
                            </div>
                        </div>
                        <div class="space-y-3 mb-6">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-orange-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">완벽주의 극복</div>
                                    <div class="text-sm text-gray-600">"틀려도 괜찮다"는 마인드셋 훈련</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-orange-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">부담 없는 연습</div>
                                    <div class="text-sm text-gray-600">AI 상대로 실수해도 부끄럽지 않음</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-orange-600 mt-1"></i>
                                <div>
                                    <div class="font-semibold text-gray-900">점진적 난이도</div>
                                    <div class="text-sm text-gray-600">쉬운 문장부터 차근차근 시작</div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-orange-50 rounded-xl p-4">
                            <div class="text-sm text-orange-900 font-semibold mb-2">
                                <i class="fas fa-lightbulb mr-2"></i>추천 모드
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-white text-orange-700 rounded-full text-xs font-medium">AI 대화</span>
                                <span class="px-3 py-1 bg-white text-orange-700 rounded-full text-xs font-medium">타이머 모드</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Use Case CTA -->
                <div class="mt-12 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">
                        당신에게 맞는 학습 방법을 찾으셨나요?
                    </h3>
                    <p class="text-gray-600 mb-6">
                        2주 무료 체험으로 직접 경험해보세요. 신용카드 등록 없이 바로 시작!
                    </p>
                    <a href="/app" class="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105">
                        <i class="fas fa-play-circle mr-2"></i>지금 바로 시작하기
                    </a>
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

        <!-- Statistics Section -->
        <section class="py-16 px-4 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-12">
                    <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
                        <i class="fas fa-chart-line mr-3"></i>숫자로 보는 WorVox
                    </h2>
                    <p class="text-xl text-white/90">실제 데이터가 증명하는 학습 효과</p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Stat 1: 학습 효율 -->
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition">
                        <div class="text-5xl font-bold text-yellow-300 mb-3">3배</div>
                        <div class="text-xl font-semibold text-white mb-2">빠른 학습 속도</div>
                        <div class="text-sm text-white/80">일반 학습 대비</div>
                    </div>

                    <!-- Stat 2: 발음 정확도 -->
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition">
                        <div class="text-5xl font-bold text-yellow-300 mb-3">95%+</div>
                        <div class="text-xl font-semibold text-white mb-2">발음 정확도</div>
                        <div class="text-sm text-white/80">3개월 학습 후 평균</div>
                    </div>

                    <!-- Stat 3: 비용 절감 -->
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition">
                        <div class="text-5xl font-bold text-yellow-300 mb-3">90%</div>
                        <div class="text-xl font-semibold text-white mb-2">비용 절감</div>
                        <div class="text-sm text-white/80">학원 대비 월 비용</div>
                    </div>

                    <!-- Stat 4: 24시간 학습 -->
                    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition">
                        <div class="text-5xl font-bold text-yellow-300 mb-3">24/7</div>
                        <div class="text-xl font-semibold text-white mb-2">언제든 학습</div>
                        <div class="text-sm text-white/80">시간 제약 없음</div>
                    </div>
                </div>

                <!-- Additional Stats -->
                <div class="mt-12 grid md:grid-cols-3 gap-6">
                    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20">
                        <div class="text-3xl font-bold text-white mb-2">1.9만원</div>
                        <div class="text-sm text-white/80">월 구독료 (무제한 학습)</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20">
                        <div class="text-3xl font-bold text-white mb-2">30+</div>
                        <div class="text-sm text-white/80">실전 시나리오</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20">
                        <div class="text-3xl font-bold text-white mb-2">2주</div>
                        <div class="text-sm text-white/80">무료 체험 기간</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->

        <!-- Comparison Table Section -->
        <section class="py-16 px-4 bg-white">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <div class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                        <i class="fas fa-trophy mr-2"></i>압도적인 차이
                    </div>
                    <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        왜 WorVox를 선택해야 할까요?
                    </h2>
                    <p class="text-xl text-gray-600 mb-6">일반 영어 학원 및 다른 플랫폼과의 비교</p>
                    <div class="flex flex-wrap justify-center gap-3">
                        <span class="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                            <i class="fas fa-check-circle mr-1"></i>비용 90% 절감
                        </span>
                        <span class="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            <i class="fas fa-check-circle mr-1"></i>학습 속도 3배
                        </span>
                        <span class="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            <i class="fas fa-check-circle mr-1"></i>24시간 이용
                        </span>
                    </div>
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
                                        <th class="py-4 sm:py-6 px-3 sm:px-6 text-center font-bold text-sm sm:text-lg bg-yellow-400 text-purple-900">
                                            <div class="flex flex-col items-center">
                                                <span class="text-xl sm:text-2xl mb-2">👑</span>
                                                <span class="text-xs sm:text-base font-bold">WorVox</span>
                                            </div>
                                        </th>
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
                                    </tr>
                                </thead>
                                <tbody>
                            <!-- 가격 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-won-sign text-purple-600 mr-2"></i>가격
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold text-base sm:text-lg">월 1.9만원</div>
                                    <div class="text-xs sm:text-sm text-gray-600">연간 할인 18%</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center text-red-600 font-semibold text-sm sm:text-base">
                                    월 20-40만원
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center text-orange-600 font-semibold text-sm sm:text-base">
                                    월 5-15만원
                                </td>
                            </tr>
                            
                            <!-- 시간 제약 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-clock text-purple-600 mr-2"></i>시간 제약
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">24시간 무제한</div>
                                    <div class="text-sm text-gray-600">언제 어디서나</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">정해진 시간</span><br/>
                                    <span class="text-sm text-gray-600">(주 2-3회)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">일부 제한</span><br/>
                                    <span class="text-sm text-gray-600">(강의 스케줄)</span>
                                </td>
                            </tr>
                            
                            <!-- 개인화 학습 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-user-cog text-purple-600 mr-2"></i>개인화 학습
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">GPT-4 AI 맞춤</div>
                                    <div class="text-sm text-gray-600">수준별 완벽 대응</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">제한적</span><br/>
                                    <span class="text-sm text-gray-600">(그룹 수업)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">없음</span><br/>
                                    <span class="text-sm text-gray-600">(일방향 강의)</span>
                                </td>
                            </tr>
                            
                            <!-- 실시간 피드백 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-comments text-purple-600 mr-2"></i>실시간 피드백
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">즉각 분석</div>
                                    <div class="text-sm text-gray-600">AI 발음·유창성 평가</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">간헐적</span><br/>
                                    <span class="text-sm text-gray-600">(수업 중만)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">없음</span><br/>
                                    <span class="text-sm text-gray-600">(녹화 강의)</span>
                                </td>
                            </tr>
                            
                            <!-- 발음 교정 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-microphone-alt text-purple-600 mr-2"></i>발음 교정
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">정밀 AI 분석</div>
                                    <div class="text-sm text-gray-600">정확도 수치화</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">주관적</span><br/>
                                    <span class="text-sm text-gray-600">(강사 재량)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">불가능</span>
                                </td>
                            </tr>
                            
                            <!-- 학습 기록 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-chart-line text-purple-600 mr-2"></i>학습 기록 관리
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">자동 상세 분석</div>
                                    <div class="text-sm text-gray-600">성장 그래프 제공</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">수동 관리</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">기본 수준</span><br/>
                                    <span class="text-sm text-gray-600">(진도율만)</span>
                                </td>
                            </tr>
                            
                            <!-- OPIC 준비 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-graduation-cap text-purple-600 mr-2"></i>OPIC 준비
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">무료 포함</div>
                                    <div class="text-sm text-gray-600">실전 시험 모드</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">별도 비용</span><br/>
                                    <span class="text-sm text-gray-600">(특강 추가)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">제한적</span>
                                </td>
                            </tr>
                            
                            <!-- 편의성 -->
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-map-marker-alt text-purple-600 mr-2"></i>장소/이동
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">완전 온라인</div>
                                    <div class="text-sm text-gray-600">모바일 지원</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-red-600">학원 방문 필수</span><br/>
                                    <span class="text-sm text-gray-600">(교통비·시간)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-green-600">온라인</span>
                                </td>
                            </tr>
                            
                            <!-- 학습 효율 -->
                            <tr class="hover:bg-gray-50 transition">
                                <td class="py-4 sm:py-6 px-3 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">
                                    <i class="fas fa-rocket text-purple-600 mr-2"></i>학습 효율
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center bg-green-50">
                                    <div class="text-green-600 font-bold">3배 빠름</div>
                                    <div class="text-sm text-gray-600">AI 집중 학습</div>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">보통</span><br/>
                                    <span class="text-sm text-gray-600">(주 2-3시간)</span>
                                </td>
                                <td class="py-4 sm:py-6 px-3 sm:px-6 text-center">
                                    <span class="text-orange-600">느림</span><br/>
                                    <span class="text-sm text-gray-600">(일방향 학습)</span>
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
                        <div class="mb-4">
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
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          // Configure Tailwind for dark mode
          tailwind.config = {
            darkMode: 'class'
          }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- JSON-LD for About Page -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "WorVox 소개",
          "description": "AI 영어 스피킹 플랫폼 WorVox의 회사 소개 및 비전",
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
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          // Configure Tailwind for dark mode
          tailwind.config = {
            darkMode: 'class'
          }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- JSON-LD for Pricing -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "WorVox Premium",
          "description": "AI 기반 영어 학습 플랫폼 프리미엄 플랜",
          "image": "https://worvox.com/static/logo.webp",
          "brand": {
            "@type": "Brand",
            "name": "WorVox"
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "KR",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 7,
            "returnMethod": "https://schema.org/ReturnByMail",
            "returnFees": "https://schema.org/FreeReturn"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127",
            "bestRating": "5",
            "worstRating": "1"
          },
          "offers": [
            {
              "@type": "Offer",
              "name": "Core 월간",
              "price": "9900",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing",
              "priceValidUntil": "2026-12-31"
            },
            {
              "@type": "Offer",
              "name": "Premium 월간",
              "price": "19000",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing",
              "priceValidUntil": "2026-12-31"
            },
            {
              "@type": "Offer",
              "name": "Core 연간",
              "price": "97416",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing",
              "priceValidUntil": "2026-12-31"
            },
            {
              "@type": "Offer",
              "name": "Premium 연간",
              "price": "186960",
              "priceCurrency": "KRW",
              "availability": "https://schema.org/InStock",
              "url": "https://worvox.com/pricing",
              "priceValidUntil": "2026-12-31"
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
        <section class="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
            <div class="max-w-4xl mx-auto">
                <div class="text-center mb-12">
                    <div class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-4">
                        <i class="fas fa-question-circle mr-2"></i>궁금한 점을 해결하세요
                    </div>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
                    <p class="text-gray-600">WorVox 이용에 대한 모든 궁금증을 해결해 드립니다</p>
                </div>
                <div class="space-y-4">
                    <!-- FAQ 1 -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-gift text-purple-600 mr-3"></i>
                            무료 체험은 어떻게 이용하나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            회원가입 후 자동으로 <strong class="text-purple-600">2주 무료 체험</strong>이 시작됩니다. 
                            <strong>신용카드 등록 없이</strong> 바로 이용 가능하며, 모든 프리미엄 기능을 체험하실 수 있습니다.
                        </p>
                    </details>

                    <!-- FAQ 2 -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-times-circle text-blue-600 mr-3"></i>
                            언제든 취소할 수 있나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            네, <strong>언제든</strong> 내 정보 페이지에서 구독을 취소할 수 있습니다. 
                            위약금이나 추가 비용 없이 즉시 취소되며, 남은 기간까지는 계속 이용 가능합니다.
                        </p>
                    </details>

                    <!-- FAQ 3 -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-percentage text-green-600 mr-3"></i>
                            연간 요금제의 혜택은 무엇인가요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            연간 요금제는 월간 대비 <strong class="text-green-600">18% 할인</strong>된 가격으로 이용하실 수 있습니다. 
                            Core는 ₩21,384, Premium은 ₩41,040을 절약할 수 있어 <strong>2개월 이상 무료</strong>로 이용하는 효과입니다.
                        </p>
                    </details>

                    <!-- FAQ 4 -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-exchange-alt text-orange-600 mr-3"></i>
                            플랜 변경은 어떻게 하나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            내 정보 페이지에서 언제든 플랜을 변경할 수 있습니다. 
                            <strong>업그레이드 시 즉시 적용</strong>되며, 다운그레이드 시 현재 기간 종료 후 적용됩니다. 
                            차액은 자동으로 정산됩니다.
                        </p>
                    </details>

                    <!-- FAQ 5: NEW -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-mobile-alt text-purple-600 mr-3"></i>
                            모바일에서도 사용할 수 있나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            네! WorVox는 <strong>PC, 태블릿, 스마트폰</strong> 모두에서 최적화되어 있습니다. 
                            브라우저만 있으면 어디서든 학습할 수 있으며, 별도의 앱 설치가 필요 없습니다.
                        </p>
                    </details>

                    <!-- FAQ 6: NEW -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-brain text-blue-600 mr-3"></i>
                            초보자도 사용할 수 있나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            물론입니다! GPT-4 AI가 <strong>당신의 수준을 자동 파악</strong>하고 맞춤형 학습을 제공합니다. 
                            초급부터 고급까지 모든 레벨에 적합하며, 쉬운 인터페이스로 누구나 쉽게 시작할 수 있습니다.
                        </p>
                    </details>

                    <!-- FAQ 7: NEW -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-clock text-green-600 mr-3"></i>
                            하루에 얼마나 학습해야 효과가 있나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            <strong>하루 15~30분</strong>만 꾸준히 학습하셔도 효과를 볼 수 있습니다. 
                            AI가 학습 패턴을 분석하여 짧은 시간에도 효율적인 학습이 가능하도록 최적화합니다. 
                            <strong class="text-green-600">일일 학습 알림</strong> 기능도 제공합니다.
                        </p>
                    </details>

                    <!-- FAQ 8: NEW -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-graduation-cap text-orange-600 mr-3"></i>
                            OPIC 시험 준비도 가능한가요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            네! <strong>OPIC 전용 시험 모드</strong>를 제공합니다. 
                            실제 OPIC 시험과 동일한 형식으로 연습할 수 있으며, AI가 답변을 분석하여 
                            <strong class="text-orange-600">예상 등급과 개선 방향</strong>을 제시합니다.
                        </p>
                    </details>

                    <!-- FAQ 9: NEW -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-shield-alt text-indigo-600 mr-3"></i>
                            개인정보는 안전한가요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            모든 데이터는 <strong>암호화되어 안전하게 보관</strong>됩니다. 
                            음성 녹음은 분석 후 즉시 삭제되며, 학습 데이터만 익명화되어 저장됩니다. 
                            개인정보 보호법을 철저히 준수합니다.
                        </p>
                    </details>

                    <!-- FAQ 10: NEW -->
                    <details class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition border border-gray-100">
                        <summary class="font-semibold text-gray-900 cursor-pointer text-lg flex items-center">
                            <i class="fas fa-headset text-purple-600 mr-3"></i>
                            문의사항이 있으면 어떻게 하나요?
                        </summary>
                        <p class="mt-4 text-gray-600 pl-8 leading-relaxed">
                            이메일 <strong class="text-purple-600">support@worvox.com</strong>으로 문의하시면 
                            <strong>24시간 내</strong>에 답변 드립니다. 
                            또는 전화 <strong>070-8064-0485</strong>로 직접 상담하실 수도 있습니다.
                        </p>
                    </details>
                </div>

                <!-- FAQ CTA -->
                <div class="mt-12 text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">더 궁금한 점이 있으신가요?</h3>
                    <p class="text-gray-600 mb-6">언제든 문의하세요. 친절하게 답변 드리겠습니다.</p>
                    <a href="mailto:support@worvox.com" class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105">
                        <i class="fas fa-envelope mr-2"></i>문의하기
                    </a>
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

// TEST PAGE - Minimal test WITHOUT CDN
app.get('/test', (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
    <title>Test WorVox - Minimal</title>
</head>
<body>
    <h1>WorVox Test (No CDN)</h1>
    <div id="app">Loading...</div>
    <div id="debug"></div>
    
    <script>
        console.log("=== Test Start ===");
        console.log("Window loaded");
    </script>
    
    <script src="/static/app.min.js?v=${BUILD_TIME}"></script>
    
    <script>
        console.log("=== After app.min.js ===");
        const debug = document.getElementById('debug');
        debug.innerHTML = '<p>WorVox class: ' + (typeof WorVox) + '</p>';
        debug.innerHTML += '<p>worvox instance: ' + (typeof worvox) + '</p>';
        
        if (typeof worvox !== 'undefined' && worvox.showLoginPage) {
            console.log("Calling showLoginPage");
            worvox.showLoginPage();
        } else {
            console.error("WorVox not found!");
        }
    </script>
</body>
</html>
  `);
});

// App page - Main application for logged users
app.get('/app', (c) => {
  // Force COMPLETE cache busting - change this number to force refresh
  const version = BUILD_TIME;
  
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
        <title>WorVox - AI 영어 스피킹 플랫폼</title>
        
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
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          // Configure Tailwind for dark mode
          tailwind.config = {
            darkMode: 'class'
          }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css?v=${version}" rel="stylesheet">
        <link href="/static/skeleton.css?v=${version}" rel="stylesheet">
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <!-- Toss Payments SDK -->
        <script src="https://js.tosspayments.com/v2/standard"></script>
        <!-- Google Sign-In -->
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <meta name="google-signin-client_id" content="506018364729-ichplnfnqlk2hmh1bhblepm0un44ltdr.apps.googleusercontent.com">
    </head>
    <body>
        <div id="app"></div>
        
        <script>
          // Simple cache management - no forced reload needed
          (function() {
            // Register Service Worker for PWA support
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(registration => {
                    console.log('✅ Service Worker registered:', registration.scope);
                    
                    // Check for updates periodically
                    setInterval(() => {
                      registration.update();
                    }, 60000); // Check every 60 seconds
                  })
                  .catch(error => {
                    console.warn('❌ Service Worker registration failed:', error);
                  });
              });
            } else {
              console.warn('⚠️ Service Workers not supported in this browser');
            }
            
            // Clear old Service Worker caches only (don't clear new PWA cache)
            // No need to delete all caches - SW handles versioning
            
            // Just log the version - files auto-update via ?v= param
            console.log('WorVox v${APP_VERSION} (build ${BUILD_TIME})');
          })();
        </script>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        
        <!-- Core Utilities -->
        <script src="/static/toast.js?v=${version}"></script>
        <script src="/static/error-handler.js?v=${version}"></script>
        <script src="/static/mobile-utils.js?v=${version}"></script>
        <script src="/static/module-loader.js?v=${version}"></script>
        
        <!-- App Scripts -->
        <script src="/static/gamification.js?v=${version}"></script>
        <script src="/static/daily-goals.js?v=${version}"></script>
        <script src="/static/daily-goals-integration.js?v=${version}"></script>
        <script src="/static/app.min.js?v=${version}"></script>
        
        <script>
          // Auto-start the app after all scripts are loaded
          window.addEventListener('load', async function() {
            if (window.worvox) {
              // Check if user is logged in
              const storedUser = localStorage.getItem('worvox_user');
              if (storedUser) {
                try {
                  const user = JSON.parse(storedUser);
                  window.worvox.currentUser = user;
                  window.worvox.userPlan = user.plan || 'free';
                  
                  // Load user data
                  try {
                    await window.worvox.loadUsageFromServer();
                    await window.worvox.loadGamificationStats();
                    
                    // Initialize daily goals system
                    if (window.dailyGoalsManager) {
                      try {
                        await window.dailyGoalsManager.init(user.id, user.goal_level || 'balanced');
                      } catch (e) {
                        console.warn('Failed to load daily goals:', e);
                      }
                    }
                    
                    // Add daily goals button after user is loaded
                    if (window.addDailyGoalsButton) {
                      window.addDailyGoalsButton();
                    }
                  } catch (e) {
                    console.warn('Failed to load user data:', e);
                  }
                  
                  // Show topic selection (main dashboard)
                  window.worvox.showTopicSelection();
                } catch (e) {
                  console.error('Failed to parse stored user:', e);
                  window.worvox.showLogin();
                }
              } else {
                window.worvox.showLogin();
              }
            } else {
              console.error('WorVox app failed to initialize');
              document.getElementById('app').innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; color: #ef4444;"><div style="text-align: center;"><h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">앱 로딩 실패</h1><p>페이지를 새로고침해주세요 (Ctrl+Shift+R)</p></div></div>';
            }
          });
        </script>
    </body>
    </html>
  `);
});

// Main page
app.get('/', (c) => {
  const version = BUILD_TIME;
  const lang = c.req.query('lang') || 'ko'; // Default to Korean
  const isKorean = lang === 'ko';
  
  // Language toggle function
  const toggleLang = isKorean ? 'en' : 'ko';
  const langButton = isKorean ? 'ENG' : 'KOR';
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="${isKorean ? 'ko' : 'en'}">
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
        <title>${isKorean ? 'WorVox - 실전 영어회화 플랫폼 | AI 발음 분석 & 1:1 전화영어' : 'WorVox - Real English Conversation Platform | AI Pronunciation Analysis & 1:1 Live Speaking'}</title>
        
        <!-- SEO Meta Tags -->
        <meta name="description" content="${isKorean ? 'WorVox는 AI 기반 발음 분석과 원어민급 강사진의 1:1 전화영어를 제공하는 실전 영어회화 플랫폼입니다. 실시간 발음 교정, 맞춤형 피드백, 6명의 전문 강사진. 무료 체험으로 시작하세요!' : 'WorVox is a real English conversation platform offering AI-based pronunciation analysis and 1:1 live speaking lessons with native-level instructors. Real-time pronunciation correction, personalized feedback, 6 professional teachers. Start with a free trial!'}">
        <meta name="keywords" content="${isKorean ? '영어회화, 전화영어, 1:1 영어, AI 발음 분석, 영어 스피킹, 실전 영어, 영어 회화 학습, 원어민 영어, 발음 교정, 영어 공부, 온라인 영어, 영어 튜터, 영어 과외, 실시간 발음 분석, 영어 말하기 연습' : 'English conversation, online English, 1:1 English, AI pronunciation analysis, English speaking, practical English, English learning, native speaker, pronunciation correction, English study, online English tutoring, real-time pronunciation analysis, English practice'}">
        <meta name="author" content="WorVox Team">
        <meta name="robots" content="index, follow">
        <meta name="language" content="${isKorean ? 'Korean' : 'English'}">
        <meta name="geo.region" content="${isKorean ? 'KR' : 'US'}">
        <meta name="geo.placename" content="${isKorean ? 'South Korea' : 'United States'}">
        
        <!-- Open Graph (Facebook, LinkedIn, KakaoTalk) -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://worvox.com${lang === 'en' ? '?lang=en' : ''}">
        <meta property="og:title" content="${isKorean ? 'WorVox - 실전 영어회화 플랫폼 | AI 발음 분석 & 1:1 전화영어' : 'WorVox - Real English Conversation Platform | AI Pronunciation & Live Speaking'}">
        <meta property="og:description" content="${isKorean ? 'AI 기반 실시간 발음 분석과 원어민급 강사진의 1:1 전화영어. 맞춤형 피드백으로 영어 실력 향상. 무료 체험 시작하세요!' : 'AI-powered real-time pronunciation analysis and 1:1 live speaking with native-level instructors. Improve your English with personalized feedback. Start your free trial!'}">
        <meta property="og:image" content="https://worvox.com/og-image.jpg">
        <meta property="og:image:secure_url" content="https://worvox.com/og-image.jpg">
        <meta property="og:image:type" content="image/jpeg">
        <meta property="og:image:width" content="2752">
        <meta property="og:image:height" content="1536">
        <meta property="og:image:alt" content="${isKorean ? 'WorVox AI 영어회화 플랫폼' : 'WorVox AI English Speaking Platform'}">
        <meta property="og:site_name" content="WorVox">
        <meta property="og:locale" content="${isKorean ? 'ko_KR' : 'en_US'}">
        <meta property="og:locale:alternate" content="${isKorean ? 'en_US' : 'ko_KR'}">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@WorVox">
        <meta name="twitter:creator" content="@WorVox">
        <meta name="twitter:url" content="https://worvox.com${lang === 'en' ? '?lang=en' : ''}">
        <meta name="twitter:title" content="${isKorean ? 'WorVox - 실전 영어회화 플랫폼' : 'WorVox - AI English Speaking Platform'}">
        <meta name="twitter:description" content="${isKorean ? 'AI 발음 분석 + 1:1 전화영어로 영어 실력 향상. 무료 체험 가능!' : 'AI pronunciation analysis + 1:1 live speaking. Start your free trial today!'}">
        <meta name="twitter:image" content="https://worvox.com/og-image.jpg">
        <meta name="twitter:image:alt" content="${isKorean ? 'WorVox AI 영어회화 플랫폼' : 'WorVox AI English Speaking Platform'}">
        
        <!-- 카카오톡 미리보기 최적화 -->
        <meta property="og:rich_attachment" content="true">
        
        <!-- 네이버 블로그 최적화 -->
        <meta property="og:article:author" content="WorVox Team">
        
        <!-- 추가 SNS 메타태그 -->
        <meta property="fb:app_id" content="">
        <meta name="pinterest-rich-pin" content="true">
        
        <!-- JSON-LD Structured Data for Google -->
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "WorVox",
          "alternateName": ["워복스", "WorVox English"],
          "url": "https://worvox.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://worvox.com/logo.png",
            "width": 512,
            "height": 512
          },
          "description": "${isKorean ? 'AI 기반 영어 학습 플랫폼. 실시간 발음 교정, ElevenLabs TTS, GPT-4 맞춤형 대화 연습 제공.' : 'AI-powered English learning platform with real-time pronunciation correction, ElevenLabs TTS, and GPT-4 personalized conversation practice.'}",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR",
            "addressLocality": "Seoul"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "email": "harperleekr@gmail.com",
            "availableLanguage": ["Korean", "English"]
          },
          "sameAs": [
            "https://worvox.com",
            "https://github.com/harperleekr-creator/worvox"
          ],
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "KRW",
            "lowPrice": "19000",
            "highPrice": "174240",
            "offerCount": "2",
            "availability": "https://schema.org/InStock"
          },
          "areaServed": {
            "@type": "Country",
            "name": "South Korea"
          },
          "availableLanguage": ["ko", "en"],
          "founder": {
            "@type": "Person",
            "name": "Harper Lee"
          },
          "keywords": "${isKorean ? '영어회화, AI 영어, 전화영어, 발음 교정, 영어 학습' : 'English conversation, AI English, phone English, pronunciation correction, English learning'}"
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "WorVox",
          "applicationCategory": "EducationalApplication",
          "applicationSubCategory": "Language Learning",
          "operatingSystem": "Web, iOS, Android",
          "browserRequirements": "Requires JavaScript, supports modern browsers",
          "url": "https://worvox.com",
          "image": "https://worvox.com/og-image.jpg",
          "screenshot": "https://worvox.com/og-image.jpg",
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
            "worstRating": "1",
            "reviewCount": "89"
          },
          "description": "${isKorean ? 'AI 영어 스피킹 플랫폼 - 실시간 발음 교정, 맞춤형 대화 연습, OPIC 스타일 시험' : 'AI English speaking platform - Real-time pronunciation correction, personalized conversation practice, OPIC-style tests'}",
          "softwareVersion": "${APP_VERSION}",
          "datePublished": "2025-12-01",
          "dateModified": "2026-03-20",
          "creator": {
            "@type": "Organization",
            "name": "WorVox Team",
            "url": "https://worvox.com"
          },
          "provider": {
            "@type": "Organization",
            "name": "WorVox",
            "url": "https://worvox.com"
          },
          "featureList": [
            "${isKorean ? 'AI 기반 발음 분석' : 'AI-powered pronunciation analysis'}",
            "${isKorean ? '1:1 원어민 강사 전화영어' : '1:1 native speaker phone lessons'}",
            "${isKorean ? '30+ 실전 시나리오' : '30+ real-life scenarios'}",
            "${isKorean ? '실시간 대화 연습' : 'Real-time conversation practice'}",
            "${isKorean ? '게임화된 학습 시스템' : 'Gamified learning system'}",
            "${isKorean ? 'OPIC 스타일 모의고사' : 'OPIC-style mock tests'}"
          ]
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "WorVox",
          "alternateName": "워복스",
          "url": "https://worvox.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://worvox.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "inLanguage": ["ko-KR", "en-US"]
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "${isKorean ? 'WorVox AI 영어회화 과정' : 'WorVox AI English Conversation Course'}",
          "description": "${isKorean ? 'AI 기반 실시간 발음 분석과 1:1 전화영어를 통한 실전 영어회화 학습' : 'Practical English conversation learning through AI-based real-time pronunciation analysis and 1:1 phone lessons'}",
          "provider": {
            "@type": "Organization",
            "name": "WorVox",
            "url": "https://worvox.com"
          },
          "educationalLevel": "${isKorean ? '초급부터 고급까지' : 'Beginner to Advanced'}",
          "teaches": "${isKorean ? '영어 회화, 발음, 듣기, 말하기' : 'English conversation, pronunciation, listening, speaking'}",
          "availableLanguage": ["ko", "en"],
          "offers": {
            "@type": "Offer",
            "category": "Subscription",
            "priceCurrency": "KRW",
            "price": "19000"
          }
        }
        </script>
        
        <!-- Canonical URL -->
        <link rel="canonical" href="https://worvox.com${lang === 'en' ? '?lang=en' : ''}">
        
        <!-- Alternate Language Versions -->
        <link rel="alternate" hreflang="ko" href="https://worvox.com">
        <link rel="alternate" hreflang="en" href="https://worvox.com?lang=en">
        <link rel="alternate" hreflang="x-default" href="https://worvox.com">
        
        <!-- Preconnect & DNS Prefetch for Performance -->
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
        <link rel="dns-prefetch" href="https://js.tosspayments.com">
        <link rel="dns-prefetch" href="https://accounts.google.com">
        <link rel="dns-prefetch" href="https://fonts.googleapis.com">
        
        <!-- Additional SEO Tags -->
        <meta name="format-detection" content="telephone=no">
        <meta name="apple-mobile-web-app-title" content="WorVox">
        <meta name="application-name" content="WorVox">
        <meta name="msapplication-TileColor" content="#a855f7">
        <meta name="msapplication-config" content="/browserconfig.xml">
        <meta name="rating" content="general">
        <meta name="distribution" content="global">
        <meta name="revisit-after" content="7 days">
        <meta name="referrer" content="origin-when-cross-origin">
        
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
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          // Configure Tailwind for dark mode
          tailwind.config = {
            darkMode: 'class'
          }
        </script>
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
          console.log('WorVox v${APP_VERSION} (build ${BUILD_TIME}) - Cache cleared');
          
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
        
        <!-- Core Utilities -->
        <script src="/static/toast.js?v=${version}"></script>
        <script src="/static/error-handler.js?v=${version}"></script>

        
        <!-- App Scripts -->
        <script src="/static/gamification.js?v=${version}"></script>
        <script src="/static/app.min.js?v=${version}"></script>
        
        <!-- Auto-redirect to teacher selection if coming from payment -->
        <script>
          window.addEventListener('load', () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('view') === 'teacher-selection') {
              // Wait for worvox object to be initialized
              setTimeout(() => {
                if (window.worvox && window.worvox.showTeacherSelection) {
                  window.worvox.showTeacherSelection();
                  // Clean up URL
                  window.history.replaceState({}, '', '/app');
                }
              }, 500);
            }
          });
        </script>
    </body>
    </html>
  `, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'Vary': '*'
  });
});

// Teacher portal page
app.get('/admin/hiing-dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - WorVox Live Speaking</title>
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-purple-50 via-white to-blue-50 min-h-screen">
        <!-- PIN 입력 모달 -->
        <div id="pinModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-shield-alt text-white text-2xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">관리자 인증</h2>
                    <p class="text-gray-600">관리자 PIN을 입력하세요</p>
                </div>
                
                <div class="mb-6">
                    <input 
                        type="password" 
                        id="adminPinInput" 
                        maxlength="4"
                        placeholder="4자리 PIN"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                        onkeypress="if(event.key==='Enter') verifyAdminPin()"
                    />
                </div>
                
                <button 
                    onclick="verifyAdminPin()" 
                    class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
                    <i class="fas fa-unlock mr-2"></i>인증하기
                </button>
                
                <p class="text-xs text-gray-500 text-center mt-4">
                    <i class="fas fa-info-circle mr-1"></i>관리자 PIN은 9999입니다
                </p>
            </div>
        </div>

        <!-- 메인 대시보드 (PIN 인증 후 표시) -->
        <div id="mainDashboard" class="hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40 shadow-sm">
                <div class="max-w-7xl mx-auto flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-crown text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-800">관리자 대시보드</h1>
                            <p class="text-sm text-gray-600">WorVox Live Speaking 통합 관리</p>
                        </div>
                    </div>
                    <button onclick="logout()" class="text-sm text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                        <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                    </button>
                </div>
            </div>

            <!-- 전체 통계 -->
            <div class="max-w-7xl mx-auto px-4 py-6">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">전체 플랫폼 통계</h2>
                    <p class="text-gray-600" id="currentPeriod">Loading...</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-users text-3xl opacity-80"></i>
                            <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">Total</span>
                        </div>
                        <div class="text-3xl font-bold mb-1" id="totalTeachers">-</div>
                        <div class="text-sm opacity-90">총 강사 수</div>
                    </div>

                    <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-check-circle text-3xl opacity-80"></i>
                            <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">Active</span>
                        </div>
                        <div class="text-3xl font-bold mb-1" id="activeTeachers">-</div>
                        <div class="text-sm opacity-90">활성 강사</div>
                    </div>

                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-calendar-check text-3xl opacity-80"></i>
                            <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">Sessions</span>
                        </div>
                        <div class="text-3xl font-bold mb-1" id="totalSessions">-</div>
                        <div class="text-sm opacity-90">전체 수업</div>
                    </div>

                    <div class="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-won-sign text-3xl opacity-80"></i>
                            <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">Revenue</span>
                        </div>
                        <div class="text-2xl font-bold mb-1" id="totalRevenue">-</div>
                        <div class="text-sm opacity-90">총 매출</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div class="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-calendar-day text-2xl text-orange-600"></i>
                            <h3 class="text-lg font-bold text-gray-800">오늘 수업</h3>
                        </div>
                        <div class="text-4xl font-bold text-orange-600" id="todaySessions">-</div>
                    </div>

                    <div class="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-clock text-2xl text-blue-600"></i>
                            <h3 class="text-lg font-bold text-gray-800">예정 수업</h3>
                        </div>
                        <div class="text-4xl font-bold text-blue-600" id="upcomingSessions">-</div>
                    </div>

                    <div class="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
                        <div class="flex items-center gap-3 mb-3">
                            <i class="fas fa-calendar-alt text-2xl text-green-600"></i>
                            <h3 class="text-lg font-bold text-gray-800">이번 달 매출</h3>
                        </div>
                        <div class="text-3xl font-bold text-green-600" id="monthlyRevenue">-</div>
                    </div>
                </div>

                <!-- 강사 목록 -->
                <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div class="p-6 border-b border-gray-200">
                        <h2 class="text-xl font-bold text-gray-800">강사별 상세 통계</h2>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">강사</th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">전문 분야</th>
                                    <th class="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">평점</th>
                                    <th class="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">총 수업</th>
                                    <th class="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">완료</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">이번 달 매출</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">총 매출</th>
                                    <th class="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">상태</th>
                                    <th class="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">액션</th>
                                </tr>
                            </thead>
                            <tbody id="teacherTableBody" class="divide-y divide-gray-200">
                                <!-- 동적으로 채워짐 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let adminPin = null;
            let dashboardData = null;

            // PIN 인증
            async function verifyAdminPin() {
                const pin = document.getElementById('adminPinInput').value;
                
                if (!pin || pin.length !== 4) {
                    alert('4자리 PIN을 입력해주세요');
                    return;
                }

                try {
                    const response = await axios.post('/api/hiing/admin/dashboard', {
                        adminPin: pin
                    });

                    if (response.data.success) {
                        adminPin = pin;
                        dashboardData = response.data;
                        document.getElementById('pinModal').classList.add('hidden');
                        document.getElementById('mainDashboard').classList.remove('hidden');
                        renderDashboard();
                    }
                } catch (error) {
                    console.error('PIN verification error:', error);
                    if (error.response?.status === 401) {
                        alert('잘못된 관리자 PIN입니다');
                    } else {
                        alert('인증 중 오류가 발생했습니다');
                    }
                    document.getElementById('adminPinInput').value = '';
                }
            }

            // 대시보드 렌더링
            function renderDashboard() {
                const { overallStats, teachers, currentMonth, currentYear } = dashboardData;

                // 기간 표시
                document.getElementById('currentPeriod').textContent = \`\${currentMonth} \${currentYear}\`;

                // 전체 통계
                document.getElementById('totalTeachers').textContent = overallStats.totalTeachers;
                document.getElementById('activeTeachers').textContent = overallStats.activeTeachers;
                document.getElementById('totalSessions').textContent = overallStats.totalSessions;
                document.getElementById('totalRevenue').textContent = overallStats.totalRevenue.toLocaleString() + '원';
                document.getElementById('todaySessions').textContent = overallStats.todaySessions;
                document.getElementById('upcomingSessions').textContent = overallStats.upcomingSessions;
                document.getElementById('monthlyRevenue').textContent = overallStats.monthlyRevenue.toLocaleString() + '원';

                // 강사 목록
                const tbody = document.getElementById('teacherTableBody');
                tbody.innerHTML = teachers.map(teacher => \`
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    \${teacher.name.charAt(0)}
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">\${teacher.name}</div>
                                    <div class="text-xs text-gray-500">\${teacher.teacherCode}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-700 max-w-xs">
                                \${teacher.specialty}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex items-center justify-center gap-1">
                                <i class="fas fa-star text-yellow-400 text-sm"></i>
                                <span class="font-medium text-gray-900">\${teacher.rating.toFixed(1)}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="font-medium text-gray-900">\${teacher.stats.totalSessions}</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                \${teacher.stats.completedSessions}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="font-medium text-green-600">
                                \${teacher.stats.monthlyRevenue.toLocaleString()}원
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="font-bold text-gray-900">
                                \${teacher.stats.totalRevenue.toLocaleString()}원
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            \${teacher.isActive 
                                ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">활성</span>'
                                : '<span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">비활성</span>'
                            }
                        </td>
                        <td class="px-6 py-4 text-center">
                            <button onclick="viewTeacherDetail(\${teacher.id}, '\${teacher.name}')" 
                                class="text-blue-600 hover:text-blue-800 font-medium text-sm hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
                                <i class="fas fa-chart-line mr-1"></i>상세보기
                            </button>
                        </td>
                    </tr>
                \`).join('');
            }

            // 강사 상세 보기
            async function viewTeacherDetail(teacherId, teacherName) {
                if (!confirm(\`\${teacherName} 강사의 상세 대시보드를 보시겠습니까?\`)) {
                    return;
                }

                try {
                    const response = await axios.post('/api/hiing/admin/teacher-detail', {
                        adminPin: adminPin,
                        teacherId: teacherId
                    });

                    if (response.data.success) {
                        const { teacher, stats, sessions } = response.data;
                        showTeacherDetailModal(teacher, stats, sessions);
                    }
                } catch (error) {
                    console.error('Teacher detail error:', error);
                    alert('강사 정보를 불러오는데 실패했습니다');
                }
            }

            // 강사 상세 모달
            function showTeacherDetailModal(teacher, stats, sessions) {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                modal.onclick = (e) => {
                    if (e.target === modal) modal.remove();
                };

                modal.innerHTML = \`
                    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                        <div class="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-2xl font-bold">\${teacher.name} 강사</h2>
                                    <p class="text-sm opacity-90">\${teacher.code} | \${teacher.specialty}</p>
                                </div>
                                <button onclick="this.closest('.fixed').remove()" 
                                    class="text-white hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-full transition-colors">
                                    <i class="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <div class="p-6">
                            <!-- 통계 -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div class="bg-blue-50 rounded-xl p-4 text-center">
                                    <div class="text-2xl font-bold text-blue-600">\${stats.totalSessions}</div>
                                    <div class="text-sm text-gray-600">총 수업</div>
                                </div>
                                <div class="bg-green-50 rounded-xl p-4 text-center">
                                    <div class="text-2xl font-bold text-green-600">\${stats.completedSessions}</div>
                                    <div class="text-sm text-gray-600">완료 수업</div>
                                </div>
                                <div class="bg-purple-50 rounded-xl p-4 text-center">
                                    <div class="text-xl font-bold text-purple-600">\${stats.monthlyRevenue.toLocaleString()}원</div>
                                    <div class="text-sm text-gray-600">이번 달</div>
                                </div>
                                <div class="bg-pink-50 rounded-xl p-4 text-center">
                                    <div class="text-xl font-bold text-pink-600">\${stats.totalRevenue.toLocaleString()}원</div>
                                    <div class="text-sm text-gray-600">총 매출</div>
                                </div>
                            </div>

                            <!-- 강사 정보 -->
                            <div class="bg-gray-50 rounded-xl p-4 mb-6">
                                <h3 class="font-bold text-gray-800 mb-3">강사 정보</h3>
                                <div class="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span class="text-gray-600">전화번호:</span>
                                        <span class="font-medium ml-2">\${teacher.phoneNumber}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">PIN 코드:</span>
                                        <span class="font-medium ml-2">\${teacher.pinCode}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">평점:</span>
                                        <span class="font-medium ml-2">\${teacher.rating.toFixed(1)} ⭐</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">상태:</span>
                                        <span class="font-medium ml-2">\${teacher.isActive ? '활성' : '비활성'}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 최근 수업 목록 -->
                            <div>
                                <h3 class="font-bold text-gray-800 mb-3">최근 수업 내역 (최대 20개)</h3>
                                <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-xl">
                                    <table class="w-full text-sm">
                                        <thead class="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th class="px-4 py-2 text-left">학생</th>
                                                <th class="px-4 py-2 text-left">예약 시간</th>
                                                <th class="px-4 py-2 text-center">시간</th>
                                                <th class="px-4 py-2 text-center">상태</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            \${sessions.slice(0, 20).map(session => {
                                                const date = new Date(session.scheduled_at);
                                                const statusColors = {
                                                    'scheduled': 'bg-blue-100 text-blue-800',
                                                    'completed': 'bg-green-100 text-green-800',
                                                    'cancelled': 'bg-red-100 text-red-800',
                                                    'no_show': 'bg-gray-100 text-gray-800'
                                                };
                                                const statusTexts = {
                                                    'scheduled': '예정',
                                                    'completed': '완료',
                                                    'cancelled': '취소',
                                                    'no_show': '노쇼'
                                                };
                                                return \`
                                                    <tr class="hover:bg-gray-50">
                                                        <td class="px-4 py-3">
                                                            <div class="font-medium">\${session.student_name || 'Unknown'}</div>
                                                            <div class="text-xs text-gray-500">\${session.student_email || ''}</div>
                                                        </td>
                                                        <td class="px-4 py-3">
                                                            \${date.toLocaleString('ko-KR', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td class="px-4 py-3 text-center">\${session.duration}분</td>
                                                        <td class="px-4 py-3 text-center">
                                                            <span class="px-2 py-1 rounded-full text-xs font-medium \${statusColors[session.status]}">
                                                                \${statusTexts[session.status]}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                \`;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                document.body.appendChild(modal);
            }

            // 로그아웃
            function logout() {
                if (confirm('로그아웃하시겠습니까?')) {
                    location.reload();
                }
            }

            // 초기화
            document.getElementById('adminPinInput').focus();
        </script>
    </body>
    </html>
  `);
});

// Admin Dashboard Route
app.get('/admin/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - WorVox Live Speaking</title>
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .stat-card { transition: all 0.3s ease; }
            .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
            .teacher-row { transition: all 0.2s ease; }
            .teacher-row:hover { background-color: #f0f9ff; }
        </style>
    </head>
    <body class="bg-gradient-to-br from-indigo-50 via-white to-pink-50 min-h-screen">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50 shadow-sm">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-shield-alt text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-gray-800">Admin Dashboard</h1>
                        <p class="text-xs text-gray-600">WorVox Live Speaking 관리</p>
                    </div>
                </div>
                <button onclick="logout()" class="text-sm text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                    <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                </button>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 py-6">
            <!-- Login Form (shown initially) -->
            <div id="loginForm" class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 max-w-md mx-auto mt-20">
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-lock text-white text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
                    <p class="text-gray-600">관리자 PIN을 입력하세요</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Admin PIN</label>
                        <input type="password" id="adminPinInput" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest"
                            placeholder="••••" maxlength="4">
                    </div>
                    <button onclick="login()" 
                        class="w-full py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all shadow-lg">
                        <i class="fas fa-sign-in-alt mr-2"></i>Login
                    </button>
                </div>
            </div>

            <!-- Dashboard Content (hidden initially) -->
            <div id="dashboardContent" class="hidden space-y-6">
                <!-- Overall Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="stat-card bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-chalkboard-teacher text-blue-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-gray-500">강사</span>
                        </div>
                        <div class="text-3xl font-bold text-gray-800" id="totalTeachers">-</div>
                        <div class="text-sm text-gray-500 mt-1">활성: <span id="activeTeachers">-</span></div>
                    </div>

                    <div class="stat-card bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-calendar-check text-green-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-gray-500">수업</span>
                        </div>
                        <div class="text-3xl font-bold text-gray-800" id="totalSessions">-</div>
                        <div class="text-sm text-gray-500 mt-1">완료: <span id="completedSessions">-</span></div>
                    </div>

                    <div class="stat-card bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-won-sign text-purple-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-gray-500" id="currentMonthLabel">이번 달</span>
                        </div>
                        <div class="text-3xl font-bold text-gray-800" id="monthlyRevenue">-</div>
                        <div class="text-sm text-gray-500 mt-1">총 매출: <span id="totalRevenue">-</span></div>
                    </div>

                    <div class="stat-card bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-orange-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-gray-500">예정</span>
                        </div>
                        <div class="text-3xl font-bold text-gray-800" id="upcomingSessions">-</div>
                        <div class="text-sm text-gray-500 mt-1">오늘: <span id="todaySessions">-</span></div>
                    </div>
                </div>

                <!-- Teachers Table -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-6 border-b border-gray-200">
                        <h2 class="text-xl font-bold text-gray-800">강사 목록 및 통계</h2>
                        <p class="text-sm text-gray-600 mt-1">각 강사의 활동 현황과 매출을 확인하세요</p>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">강사</th>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">전문분야</th>
                                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">전체 수업</th>
                                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">완료</th>
                                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">이번 달 매출</th>
                                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">총 매출</th>
                                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">예정</th>
                                    <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">상태</th>
                                </tr>
                            </thead>
                            <tbody id="teachersTableBody" class="divide-y divide-gray-200">
                                <tr>
                                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                        <div>데이터를 불러오는 중...</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let adminPin = '';

            async function login() {
                const pin = document.getElementById('adminPinInput').value;
                
                if (pin.length !== 4) {
                    alert('4자리 PIN을 입력하세요');
                    return;
                }

                try {
                    const response = await axios.post('/api/hiing/admin/dashboard', { adminPin: pin });
                    
                    if (response.data.success) {
                        adminPin = pin;
                        document.getElementById('loginForm').classList.add('hidden');
                        document.getElementById('dashboardContent').classList.remove('hidden');
                        displayDashboardData(response.data);
                    } else {
                        alert('잘못된 관리자 PIN입니다');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    alert('로그인 실패: ' + (error.response?.data?.error || error.message));
                }
            }

            function displayDashboardData(data) {
                const { overallStats, teachers, currentMonth, currentYear } = data;
                
                // Overall stats
                document.getElementById('totalTeachers').textContent = overallStats.totalTeachers;
                document.getElementById('activeTeachers').textContent = overallStats.activeTeachers;
                document.getElementById('totalSessions').textContent = overallStats.totalSessions.toLocaleString();
                document.getElementById('completedSessions').textContent = overallStats.completedSessions.toLocaleString();
                document.getElementById('monthlyRevenue').textContent = '₩' + overallStats.monthlyRevenue.toLocaleString();
                document.getElementById('totalRevenue').textContent = '₩' + overallStats.totalRevenue.toLocaleString();
                document.getElementById('upcomingSessions').textContent = overallStats.upcomingSessions.toLocaleString();
                document.getElementById('todaySessions').textContent = overallStats.todaySessions.toLocaleString();
                document.getElementById('currentMonthLabel').textContent = currentMonth;

                // Teachers table
                const tbody = document.getElementById('teachersTableBody');
                tbody.innerHTML = '';

                teachers.forEach(teacher => {
                    const row = document.createElement('tr');
                    row.className = 'teacher-row';
                    row.innerHTML = \`
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    \${teacher.name.charAt(0)}
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-800">\${teacher.name}</div>
                                    <div class="text-xs text-gray-500">@\${teacher.teacherCode}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-700">\${teacher.specialty}</div>
                            <div class="text-xs text-gray-500">\${teacher.experience}</div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="text-sm font-semibold text-gray-800">\${teacher.stats.totalSessions}</div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="text-sm font-semibold text-green-600">\${teacher.stats.completedSessions}</div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="text-sm font-semibold text-purple-600">₩\${teacher.stats.monthlyRevenue.toLocaleString()}</div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="text-sm font-semibold text-gray-800">₩\${teacher.stats.totalRevenue.toLocaleString()}</div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="text-sm font-semibold text-orange-600">\${teacher.stats.upcomingSessions}</div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            \${teacher.isActive 
                                ? '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">활성</span>' 
                                : '<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">비활성</span>'
                            }
                        </td>
                    \`;
                    tbody.appendChild(row);
                });
            }

            function logout() {
                if (confirm('로그아웃 하시겠습니까?')) {
                    adminPin = '';
                    document.getElementById('loginForm').classList.remove('hidden');
                    document.getElementById('dashboardContent').classList.add('hidden');
                    document.getElementById('adminPinInput').value = '';
                }
            }

            // Enter key support
            document.getElementById('adminPinInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login();
                }
            });
        </script>
    </body>
    </html>
  `);
});

app.get('/teacher/:teacherCode', (c) => {
  const teacherCode = c.req.param('teacherCode');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teacher Portal - WorVox Live Speaking</title>
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50 shadow-sm">
            <div class="max-w-4xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-chalkboard-teacher text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-gray-800">Teacher Portal</h1>
                        <p class="text-xs text-gray-600" id="teacherName">Loading...</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="showChangePinModal()" class="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-key mr-1"></i>PIN 변경
                    </button>
                    <button onclick="logout()" class="text-sm text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                        <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                    </button>
                </div>
            </div>
        </div>

        <div class="max-w-4xl mx-auto px-4 py-6">
            <!-- Login Form (shown initially) -->
            <div id="loginForm" class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-lock text-white text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Teacher Login</h2>
                    <p class="text-gray-600">Enter your PIN to access the portal</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">PIN Code</label>
                        <input type="password" id="pinInput" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                            placeholder="••••" maxlength="4">
                    </div>
                    <button onclick="login()" 
                        class="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                        <i class="fas fa-sign-in-alt mr-2"></i>Login
                    </button>
                </div>
            </div>

            <!-- PIN Change Modal (hidden by default) -->
            <div id="changePinModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full border border-gray-100">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-key text-white text-2xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">PIN 번호 변경</h2>
                        <p class="text-gray-600 text-sm">새로운 4자리 PIN을 설정하세요</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">현재 PIN</label>
                            <input type="password" id="currentPinInput" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest"
                                placeholder="••••" maxlength="4">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">새 PIN</label>
                            <input type="password" id="newPinInput" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest"
                                placeholder="••••" maxlength="4">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">새 PIN 확인</label>
                            <input type="password" id="confirmPinInput" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest"
                                placeholder="••••" maxlength="4">
                        </div>
                        
                        <div class="flex gap-3 pt-2">
                            <button onclick="hideChangePinModal()" 
                                class="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all">
                                <i class="fas fa-times mr-2"></i>취소
                            </button>
                            <button onclick="changePin()" 
                                class="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                                <i class="fas fa-check mr-2"></i>변경
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dashboard (shown after login) -->
            <div id="sessionsContainer" class="hidden">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <!-- Total Lessons -->
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-calendar-check text-2xl opacity-80"></i>
                            <span class="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">이번 달</span>
                        </div>
                        <p class="text-3xl font-bold" id="totalLessons">0</p>
                        <p class="text-sm opacity-90 mt-1">완료된 수업</p>
                    </div>

                    <!-- 25-min Lessons -->
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-5 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-clock text-2xl opacity-80"></i>
                            <span class="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">25분</span>
                        </div>
                        <p class="text-3xl font-bold" id="lessons25">0</p>
                        <p class="text-sm opacity-90 mt-1">25분 수업</p>
                    </div>

                    <!-- 50-min Lessons -->
                    <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-5 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-hourglass-half text-2xl opacity-80"></i>
                            <span class="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">50분</span>
                        </div>
                        <p class="text-3xl font-bold" id="lessons50">0</p>
                        <p class="text-sm opacity-90 mt-1">50분 수업</p>
                    </div>

                    <!-- Total Revenue -->
                    <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-5 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-won-sign text-2xl opacity-80"></i>
                            <span class="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">매출</span>
                        </div>
                        <p class="text-3xl font-bold" id="totalRevenue">0원</p>
                        <p class="text-sm opacity-90 mt-1">이번 달 수익</p>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
                    <div class="flex border-b border-gray-200">
                        <button onclick="switchTab('upcoming')" id="tab-upcoming" 
                            class="flex-1 px-6 py-4 font-semibold text-blue-600 border-b-2 border-blue-600">
                            <i class="fas fa-calendar-day mr-2"></i>예약 현황
                        </button>
                        <button onclick="switchTab('calendar')" id="tab-calendar" 
                            class="flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                            <i class="fas fa-calendar-alt mr-2"></i>월별 캘린더
                        </button>
                        <button onclick="switchTab('completed')" id="tab-completed" 
                            class="flex-1 px-6 py-4 font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                            <i class="fas fa-check-circle mr-2"></i>완료 내역
                        </button>
                    </div>
                </div>

                <!-- Tab Content: Upcoming Lessons -->
                <div id="content-upcoming" class="space-y-4">
                    <div class="text-center py-12">
                        <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">Loading sessions...</p>
                    </div>
                </div>

                <!-- Tab Content: Calendar View -->
                <div id="content-calendar" class="hidden">
                    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div class="flex items-center justify-between mb-6">
                            <button onclick="changeMonth(-1)" class="p-2 hover:bg-gray-100 rounded-lg">
                                <i class="fas fa-chevron-left text-gray-600"></i>
                            </button>
                            <h3 class="text-xl font-bold text-gray-800" id="calendarMonth">2026년 3월</h3>
                            <button onclick="changeMonth(1)" class="p-2 hover:bg-gray-100 rounded-lg">
                                <i class="fas fa-chevron-right text-gray-600"></i>
                            </button>
                        </div>
                        <div id="calendarGrid" class="grid grid-cols-7 gap-2">
                            <!-- Calendar will be generated here -->
                        </div>
                    </div>
                </div>

                <!-- Tab Content: Completed Lessons -->
                <div id="content-completed" class="hidden space-y-4">
                    <div class="text-center py-12">
                        <i class="fas fa-check-circle text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">완료된 수업이 없습니다</p>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const teacherCode = '${teacherCode}';
            let teacherPin = null;
            let teacherData = null;
            let allSessions = [];
            let currentTab = 'upcoming';
            let currentMonth = new Date();

            // Auto-focus PIN input
            document.getElementById('pinInput').focus();
            
            // Allow Enter key to submit
            document.getElementById('pinInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') login();
            });

            async function login() {
                const pin = document.getElementById('pinInput').value;
                
                if (!pin || pin.length !== 4) {
                    alert('Please enter a 4-digit PIN');
                    return;
                }

                try {
                    const response = await axios.post('/api/hiing/teacher/sessions', {
                        teacherCode: teacherCode,
                        pinCode: pin
                    });

                    if (response.data.success) {
                        teacherPin = pin;
                        teacherData = response.data.teacher;
                        document.getElementById('teacherName').textContent = teacherData.name;
                        document.getElementById('loginForm').classList.add('hidden');
                        document.getElementById('sessionsContainer').classList.remove('hidden');
                        loadSessions(response.data.sessions);
                    } else {
                        alert('Invalid PIN. Please try again.');
                        document.getElementById('pinInput').value = '';
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    alert('Login failed: ' + (error.response?.data?.error || 'Invalid PIN'));
                    document.getElementById('pinInput').value = '';
                }
            }

            function loadSessions(sessions) {
                allSessions = sessions || [];
                updateStats();
                renderCurrentTab();
            }

            function updateStats() {
                const now = new Date();
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                // Filter this month's completed sessions
                const thisMonthCompleted = allSessions.filter(s => {
                    const sessionDate = new Date(s.scheduled_at);
                    return s.status === 'completed' && 
                           sessionDate >= currentMonthStart && 
                           sessionDate <= currentMonthEnd;
                });

                const total = thisMonthCompleted.length;
                const lessons25 = thisMonthCompleted.filter(s => s.duration === 25).length;
                const lessons50 = thisMonthCompleted.filter(s => s.duration === 50).length;
                
                // Revenue calculation: 25분 = 10,500원, 50분 = 21,000원
                const revenue = (lessons25 * 10500) + (lessons50 * 21000);

                document.getElementById('totalLessons').textContent = total;
                document.getElementById('lessons25').textContent = lessons25;
                document.getElementById('lessons50').textContent = lessons50;
                document.getElementById('totalRevenue').textContent = revenue.toLocaleString() + '원';
            }

            function switchTab(tab) {
                currentTab = tab;
                
                // Update tab buttons
                ['upcoming', 'calendar', 'completed'].forEach(t => {
                    const btn = document.getElementById('tab-' + t);
                    const content = document.getElementById('content-' + t);
                    
                    if (t === tab) {
                        btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                        btn.classList.remove('text-gray-600');
                        content.classList.remove('hidden');
                    } else {
                        btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                        btn.classList.add('text-gray-600');
                        content.classList.add('hidden');
                    }
                });

                renderCurrentTab();
            }

            function renderCurrentTab() {
                if (currentTab === 'upcoming') {
                    renderUpcoming();
                } else if (currentTab === 'calendar') {
                    renderCalendar();
                } else if (currentTab === 'completed') {
                    renderCompleted();
                }
            }

            function renderUpcoming() {
                const container = document.getElementById('content-upcoming');
                const upcoming = allSessions.filter(s => s.status === 'scheduled');

                if (upcoming.length === 0) {
                    container.innerHTML = \`
                        <div class="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                            <i class="fas fa-calendar-check text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-600 text-lg">예약된 수업이 없습니다</p>
                            <p class="text-gray-500 text-sm mt-2">새로운 예약이 들어오면 여기에 표시됩니다</p>
                        </div>
                    \`;
                    return;
                }

                container.innerHTML = upcoming
                    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                    .map(session => renderSession(session, true))
                    .join('');
            }

            function renderCompleted() {
                const container = document.getElementById('content-completed');
                const completed = allSessions.filter(s => s.status === 'completed');

                if (completed.length === 0) {
                    container.innerHTML = \`
                        <div class="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                            <i class="fas fa-check-circle text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-600 text-lg">완료된 수업이 없습니다</p>
                        </div>
                    \`;
                    return;
                }

                container.innerHTML = completed
                    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
                    .map(session => renderSession(session, false))
                    .join('');
            }

            function renderCalendar() {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                
                document.getElementById('calendarMonth').textContent = 
                    \`\${year}년 \${month + 1}월\`;

                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                let html = ['일', '월', '화', '수', '목', '금', '토'].map(day => 
                    \`<div class="text-center font-semibold text-gray-600 py-2">\${day}</div>\`
                ).join('');

                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                    html += '<div class="text-center p-2"></div>';
                }

                // Days of month
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    const daySessions = allSessions.filter(s => {
                        const sessionDate = new Date(s.scheduled_at);
                        return sessionDate.toISOString().split('T')[0] === dateStr;
                    });

                    const isToday = new Date().toDateString() === date.toDateString();
                    const hasSession = daySessions.length > 0;

                    html += \`
                        <div class="relative border rounded-lg p-2 min-h-[60px] \${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'} \${hasSession ? 'bg-emerald-50' : ''}">
                            <div class="text-sm font-semibold text-gray-700 mb-1">\${day}</div>
                            \${daySessions.map(s => {
                                const time = new Date(s.scheduled_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                                const statusColor = s.status === 'completed' ? 'bg-emerald-600' : 'bg-blue-600';
                                return \`<div class="\${statusColor} text-white text-xs px-1 py-0.5 rounded mb-1" title="\${s.username} - \${time}">\${time}</div>\`;
                            }).join('')}
                        </div>
                    \`;
                }

                document.getElementById('calendarGrid').innerHTML = html;
            }

            function changeMonth(delta) {
                currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
                renderCalendar();
            }

            function renderSession(session, showCompleteButton = true) {
                const date = new Date(session.scheduled_at);
                const now = new Date();
                const isPast = date < now;
                const isCompleted = session.status === 'completed';
                const studentPhone = session.student_phone || 'N/A';
                
                // Calculate revenue for this session
                const sessionRevenue = session.duration === 25 ? 10500 : 21000;
                
                return \`
                    <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 \${isCompleted ? 'opacity-90' : ''}">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-3">
                                    <h3 class="text-lg font-bold text-gray-800">\${session.username || 'Student'}</h3>
                                    \${isCompleted ? \`
                                        <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">
                                            <i class="fas fa-check mr-1"></i>완료
                                        </span>
                                    \` : isPast ? \`
                                        <span class="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                                            <i class="fas fa-exclamation-circle mr-1"></i>대기중
                                        </span>
                                    \` : \`
                                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                            <i class="fas fa-calendar mr-1"></i>예약됨
                                        </span>
                                    \`}
                                </div>
                                
                                <div class="space-y-2 text-sm text-gray-600">
                                    <p class="flex items-center gap-2">
                                        <i class="fas fa-envelope text-gray-400 w-5"></i> 
                                        <span>\${session.email}</span>
                                    </p>
                                    <p class="flex items-center gap-2">
                                        <i class="fas fa-phone text-blue-500 w-5"></i> 
                                        <span class="font-semibold text-blue-600">\${studentPhone}</span>
                                    </p>
                                    <p class="flex items-center gap-2">
                                        <i class="fas fa-calendar-day text-purple-500 w-5"></i> 
                                        <span>\${date.toLocaleDateString('ko-KR', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </p>
                                    <p class="flex items-center gap-2">
                                        <i class="fas fa-clock text-orange-500 w-5"></i> 
                                        <span class="font-semibold">\${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span class="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold">\${session.duration}분</span>
                                    </p>
                                    \${isCompleted ? \`
                                        <p class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                            <i class="fas fa-won-sign text-emerald-500 w-5"></i> 
                                            <span class="text-emerald-600 font-bold">\${sessionRevenue.toLocaleString()}원</span>
                                        </p>
                                    \` : ''}
                                </div>
                            </div>
                            
                            \${!isCompleted && showCompleteButton ? \`
                                <button onclick="completeSession(\${session.id})" 
                                    class="px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg whitespace-nowrap">
                                    <i class="fas fa-check mr-2"></i>수업 완료
                                </button>
                            \` : isCompleted ? \`
                                <div class="flex flex-col items-center gap-2">
                                    <div class="text-emerald-600 text-3xl">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <span class="text-xs text-emerald-600 font-semibold">완료됨</span>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                \`;
            }

            async function completeSession(sessionId) {
                const confirmed = confirm('이 수업을 완료 처리하시겠습니까?\\n\\n학생의 수업권 1개가 차감됩니다.');
                if (!confirmed) return;

                try {
                    const response = await axios.post('/api/hiing/teacher/complete', {
                        teacherCode: teacherCode,
                        pinCode: teacherPin,
                        sessionId: sessionId
                    });

                    if (response.data.success) {
                        alert('✅ 수업이 완료 처리되었습니다!\\n학생의 남은 수업권: ' + response.data.remaining_credits + '개');
                        
                        // Reload sessions
                        const sessionsResponse = await axios.post('/api/hiing/teacher/sessions', {
                            teacherCode: teacherCode,
                            pinCode: teacherPin
                        });
                        if (sessionsResponse.data.success) {
                            loadSessions(sessionsResponse.data.sessions);
                        }
                    } else {
                        alert('수업 완료 처리 실패: ' + response.data.error);
                    }
                } catch (error) {
                    console.error('Complete session error:', error);
                    alert('오류 발생: ' + (error.response?.data?.error || error.message));
                }
            }

            function showChangePinModal() {
                document.getElementById('changePinModal').classList.remove('hidden');
                document.getElementById('currentPinInput').value = '';
                document.getElementById('newPinInput').value = '';
                document.getElementById('confirmPinInput').value = '';
                document.getElementById('currentPinInput').focus();
            }

            function hideChangePinModal() {
                document.getElementById('changePinModal').classList.add('hidden');
            }

            async function changePin() {
                const currentPin = document.getElementById('currentPinInput').value;
                const newPin = document.getElementById('newPinInput').value;
                const confirmPin = document.getElementById('confirmPinInput').value;

                // Validation
                if (!currentPin || currentPin.length !== 4) {
                    alert('현재 PIN을 4자리로 입력해주세요');
                    return;
                }

                if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
                    alert('새 PIN은 4자리 숫자여야 합니다');
                    return;
                }

                if (newPin !== confirmPin) {
                    alert('새 PIN이 일치하지 않습니다');
                    return;
                }

                if (currentPin === newPin) {
                    alert('새 PIN이 현재 PIN과 동일합니다. 다른 PIN을 입력해주세요');
                    return;
                }

                try {
                    const response = await axios.post('/api/hiing/teacher/change-pin', {
                        teacherCode: teacherCode,
                        currentPin: currentPin,
                        newPin: newPin
                    });

                    if (response.data.success) {
                        alert('✅ PIN이 성공적으로 변경되었습니다!\\n다음 로그인부터 새 PIN을 사용하세요.');
                        teacherPin = newPin; // Update current session PIN
                        hideChangePinModal();
                    } else {
                        alert('PIN 변경 실패: ' + response.data.error);
                    }
                } catch (error) {
                    console.error('Change PIN error:', error);
                    if (error.response?.status === 401) {
                        alert('❌ 현재 PIN이 올바르지 않습니다');
                    } else {
                        alert('오류 발생: ' + (error.response?.data?.error || error.message));
                    }
                }
            }

            function logout() {
                if (confirm('로그아웃 하시겠습니까?')) {
                    teacherPin = null;
                    teacherData = null;
                    allSessions = [];
                    document.getElementById('pinInput').value = '';
                    document.getElementById('loginForm').classList.remove('hidden');
                    document.getElementById('sessionsContainer').classList.add('hidden');
                    document.getElementById('pinInput').focus();
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Export both app and scheduled job
export default {
  fetch: app.fetch,
  scheduled: scheduled.scheduled
};
