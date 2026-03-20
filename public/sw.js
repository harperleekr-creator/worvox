/**
 * WorVox Service Worker
 * PWA 오프라인 기능 및 캐싱 전략
 */

const CACHE_VERSION = 'worvox-v1';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;

// 캐시할 정적 자원
const STATIC_ASSETS = [
  '/',
  '/app',
  '/static/app.js',
  '/static/app.min.js',
  '/static/style.css',
  '/static/skeleton.css',
  '/static/toast.js',
  '/static/error-handler.js',
  '/static/gamification.js',
  '/manifest.json',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// API 캐시 전략
const API_CACHE_DURATION = 5 * 60 * 1000; // 5분
const API_PATTERNS = [
  /\/api\/topics/,
  /\/api\/users\/\d+\/stats/,
  /\/api\/gamification\/stats/
];

// 캐시하지 않을 패턴
const NO_CACHE_PATTERNS = [
  /\/api\/chat/,
  /\/api\/pronunciation/,
  /\/api\/audio/,
  /\/api\/payment/
];

/**
 * Service Worker 설치
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Service Worker 활성화
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith(CACHE_VERSION) && cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
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
 * Cache First 전략 (정적 자원용)
 */
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('💾 Cached new resource:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Fetch failed:', error);
    
    // 오프라인 폴백 페이지
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/app') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

/**
 * Network First 전략 (API용)
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request.clone());
    
    // 성공적인 응답이면 캐시에 저장
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      
      // 캐시 만료 시간 설정
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
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
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < API_CACHE_DURATION) {
          console.log('📦 Serving API from cache:', request.url);
          return cachedResponse;
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
