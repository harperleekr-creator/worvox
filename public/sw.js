/**
 * WorVox Service Worker
 * PWA 오프라인 기능 및 캐싱 전략
 */

const CACHE_VERSION = 'worvox-v7-force-refresh';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// 즉시 캐시할 핵심 자원 (Critical Path)
const CRITICAL_ASSETS = [
  '/',
  '/app',
  '/static/app.min.js',
  '/static/style.css',
  '/static/skeleton.css',
  '/static/toast.js',
  '/manifest.json'
];

// 지연 캐시 가능한 자원 (Non-Critical)
const SECONDARY_ASSETS = [
  '/static/error-handler.js',
  '/static/gamification.js',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// API 캐시 전략 - 시간 기반
const API_CACHE_DURATIONS = {
  short: 1 * 60 * 1000,      // 1분 - 실시간 데이터
  medium: 5 * 60 * 1000,     // 5분 - 일반 데이터
  long: 30 * 60 * 1000       // 30분 - 정적 데이터
};

const API_PATTERNS = {
  long: [/\/api\/topics/, /\/api\/scenarios/],
  medium: [/\/api\/users\/\d+\/stats/, /\/api\/gamification\/stats/],
  short: [/\/api\/sessions/, /\/api\/daily-goals/]
};

// 절대 캐시하지 않을 패턴 (실시간 필수)
const NO_CACHE_PATTERNS = [
  /\/api\/chat/,
  /\/api\/stt/,
  /\/api\/tts/,
  /\/api\/pronunciation/,
  /\/api\/audio/,
  /\/api\/payment/,
  /\/api\/signup/,
  /\/api\/login/,
  /\/api\/retention/,  // Retention API는 캐시하지 않음 (POST 요청)
  /\/api\/sessions/,   // Session API는 캐시하지 않음 (실시간 세션 생성)
  /\/api\/usage/       // Usage API는 캐시하지 않음 (실시간 사용량 추적)
];

/**
 * Service Worker 설치 - 개선된 캐싱 전략
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing (v7-force-refresh)...');
  
  event.waitUntil(
    Promise.all([
      // 핵심 자원 즉시 캐시 (Critical Path)
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      
      // 보조 자원 지연 캐시 (Non-Critical)
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching secondary assets');
        return Promise.all(
          SECONDARY_ASSETS.map(url => 
            cache.add(new Request(url, { cache: 'reload' })).catch(() => {
              console.warn('⚠️ Failed to cache:', url);
            })
          )
        );
      })
    ])
    .catch((error) => {
      console.error('❌ Cache installation failed:', error);
    })
    .then(() => {
      console.log('✅ Service Worker installed');
      self.skipWaiting();
    })
  );
});

/**
 * Service Worker 활성화 - 개선된 캐시 정리
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating (v7-force-refresh)...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 현재 버전이 아닌 모든 캐시 삭제
            if (!currentCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated and ready');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch 요청 처리
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome extension 요청 무시
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 외부 CDN 요청 무시
  if (!url.origin.includes(self.location.origin) && 
      !url.origin.includes('cloudflare') &&
      !url.origin.includes('pages.dev')) {
    return;
  }

  // 캐시하지 않을 패턴 확인
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(fetch(request));
    return;
  }

  // API 요청 처리 (Network First with Cache Fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 정적 자원 처리 (Cache First with Network Fallback)
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache First 전략 (정적 자원용) - 개선됨
 */
async function cacheFirstStrategy(request) {
  try {
    const url = new URL(request.url);
    const isImage = /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url.pathname);
    const cacheName = isImage ? IMAGE_CACHE : STATIC_CACHE;
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // 백그라운드에서 새로운 버전 확인 (Stale-While-Revalidate) - GET 요청만
      if (!url.pathname.includes('.min.') && request.method === 'GET') {
        fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(cacheName).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
        }).catch(() => {}); // 실패해도 무시
      }
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && (request.method === 'GET' || request.method === 'HEAD')) {
      const cache = await caches.open(cacheName);
      
      // 이미지는 1주일 캐시
      if (isImage) {
        const headers = new Headers(networkResponse.headers);
        headers.set('sw-cache-time', Date.now().toString());
        const modifiedResponse = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: headers
        });
        cache.put(request, modifiedResponse);
      } else {
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Fetch failed:', error);
    
    // 오프라인 폴백
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      const fallback = await cache.match('/app');
      if (fallback) return fallback;
      
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>오프라인 - WorVox</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>🔌 오프라인 상태</h1>
          <p>인터넷 연결을 확인해주세요.</p>
          <button onclick="location.reload()">다시 시도</button>
        </body>
        </html>
      `, { 
        status: 503, 
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      });
    }
    
    throw error;
  }
}

/**
 * Network First 전략 (API용) - 개선됨
 */
async function networkFirstStrategy(request) {
  const url = new URL(request.url);
  
  // API 캐시 만료 시간 결정
  let cacheDuration = API_CACHE_DURATIONS.medium;
  for (const [duration, patterns] of Object.entries(API_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(url.pathname))) {
      cacheDuration = API_CACHE_DURATIONS[duration];
      break;
    }
  }
  
  try {
    const networkResponse = await fetch(request.clone(), {
      // 네트워크 타임아웃 설정 (10초)
      signal: AbortSignal.timeout(10000)
    });
    
    // 성공적인 응답이면 캐시에 저장 (GET/HEAD 요청만)
    if (networkResponse && networkResponse.status === 200 && (request.method === 'GET' || request.method === 'HEAD')) {
      const cache = await caches.open(API_CACHE);
      
      // 캐시 만료 시간과 타입 설정
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      headers.set('sw-cache-duration', cacheDuration.toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('🌐 Network failed, trying cache:', request.url);
    
    // 네트워크 실패 시 캐시된 응답 사용
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // 캐시 만료 시간 확인
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      const savedDuration = cachedResponse.headers.get('sw-cache-duration');
      
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        const maxAge = savedDuration ? parseInt(savedDuration) : cacheDuration;
        
        if (age < maxAge) {
          console.log('📦 Serving stale API from cache:', request.url);
          // Stale 데이터임을 표시
          const headers = new Headers(cachedResponse.headers);
          headers.set('X-From-Cache', 'true');
          headers.set('X-Cache-Age', Math.floor(age / 1000).toString() + 's');
          
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: headers
          });
        } else {
          console.log('⏰ Cache expired for:', request.url);
        }
      }
    }
    
    throw error;
  }
}

/**
 * Background Sync (향후 확장용)
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 향후 오프라인 데이터 동기화 로직
  console.log('📡 Syncing offline data...');
}

/**
 * Push Notification (향후 확장용)
 */
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from WorVox',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'worvox-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('WorVox', options)
  );
});

/**
 * Notification Click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes('/app') && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow('/app');
        }
      })
  );
});

/**
 * Message 이벤트 (클라이언트와 통신)
 */
self.addEventListener('message', (event) => {
  console.log('💬 Message from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('🚀 Service Worker loaded');
