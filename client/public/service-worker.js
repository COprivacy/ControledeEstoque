
const CACHE_NAME = 'pavisoft-smartestoque-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';

// Recursos essenciais para cache no install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Recursos que devem usar network-first
const NETWORK_FIRST_ROUTES = [
  '/api/',
];

// Recursos que devem usar cache-first
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
  /\.(?:js|css)$/,
];

// Install - Cache inicial
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Estratégia híbrida
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests externos
  if (url.origin !== location.origin) {
    return;
  }

  // Apenas GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API routes - Network First com fallback
  if (NETWORK_FIRST_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache em caso de erro de rede
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[Service Worker] Serving from cache (offline):', request.url);
              return cached;
            }
            // Retornar página offline customizada
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Static assets - Cache First
  const isCacheFirst = CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (isCacheFirst) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });

              return response;
            });
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          throw error;
        })
    );
    return;
  }

  // Outras rotas - Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});

// Background Sync (futura implementação)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  // Implementar sincronização de dados offline
});

// Push Notifications (futura implementação)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  // Implementar notificações push
});

// Message handler
self.addEventListener('message', (event) => {
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
