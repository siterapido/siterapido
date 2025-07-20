const CACHE_NAME = 'siterapido-v1.0.1';
const STATIC_CACHE = 'static-v1.0.1';
const DYNAMIC_CACHE = 'dynamic-v1.0.1';

// Recursos para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/coolvetica-rg.woff2',
  '/assets/coolvetica-compressed-hv.woff2',
  '/assets/coolvetica-condensed-rg.woff2',
  '/assets/coolvetica-crammed-rg.woff2',
  '/assets/coolvetica-rg-it.woff2',
];

// Recursos para cache dinâmico
const DYNAMIC_ASSETS = [
  '/assets/optimized/site-hero-cerna-hero-v2.jpg',
  '/assets/optimized/site-engicore.webp',
  '/assets/optimized/site-sancao.webp',
  '/assets/optimized/site-hotledas.webp',
  '/assets/optimized/site-alive.webp',
  '/assets/optimized/logo-principal-preta.webp',
  '/assets/optimized/logo-footer.webp',
  '/assets/icone-1.jpg',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(DYNAMIC_ASSETS);
      }),
    ])
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia Cache First para recursos estáticos
  if (request.method === 'GET' && isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Estratégia Network First para recursos dinâmicos
  if (request.method === 'GET' && isDynamicAsset(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Estratégia Network First para API calls
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Estratégia Stale While Revalidate para HTML
  if (request.method === 'GET' && request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// Funções auxiliares
function isStaticAsset(pathname) {
  return (
    pathname.includes('/assets/') ||
    pathname.includes('/Fontes/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff')
  );
}

function isDynamicAsset(pathname) {
  return (
    pathname.includes('/assets/') &&
    (pathname.endsWith('.webp') ||
     pathname.endsWith('.png') ||
     pathname.endsWith('.jpg') ||
     pathname.endsWith('.jpeg') ||
     pathname.endsWith('.avif'))
  );
}

// Background sync para requisições offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implementar sincronização em background se necessário
  console.log('Background sync executed');
} 