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
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">우리의 미션</h2>
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
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">WorVox와 함께 얻는 것</h2>
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
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">최첨단 AI 기술</h2>
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
