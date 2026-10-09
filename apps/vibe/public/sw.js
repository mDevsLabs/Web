/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SERVICE WORKER (public/sw.js)
 * Caches App Shell & Assets for Fast Offline / Mobile PWA Experience
 * ============================================================================
 */

const CACHE_NAME = 'vibe-pwa-v4';
const MAX_CACHE_ENTRIES = 80;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/favicon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Chemins jamais mis en cache : API, auth, proxys dev, scripts.
const NEVER_CACHE = [
  '/api/',
  '/v1/',
  '/vibe/',
  '/login',
  '/register',
  '/verify',
  '/auth',
  '/upload',
  '/chat',
  '/models',
  '/images',
  '/audio',
  '/me',
  '/sw.js',
];

function shouldSkip(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return true;
    return NEVER_CACHE.some((p) => u.pathname.startsWith(p));
  } catch {
    return true;
  }
}

// Borne la taille du cache : supprime les entrées les plus anciennes.
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (const key of keys.slice(0, keys.length - maxEntries)) {
    await cache.delete(key);
  }
}

// Install : pré-cache de l'app shell — PAS de skipWaiting automatique
// (une activation immédiate casserait les chunks lazy en cours de session).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

// L'utilisateur (bannière « Nouvelle version disponible ») demande l'activation immédiate.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate : purge des caches obsolètes + prise de contrôle des clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Fetch : network-first + repli cache pour les assets statiques uniquement.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (shouldSkip(request.url)) return;

  const destination = request.destination;
  const cacheable =
    destination === 'document' ||
    destination === 'script' ||
    destination === 'style' ||
    destination === 'font' ||
    destination === 'image' ||
    destination === 'manifest' ||
    destination === '';

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (cacheable && response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseToCache))
            .then(() => trimCache(CACHE_NAME, MAX_CACHE_ENTRIES))
            .catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') {
          const shell = await caches.match('/index.html');
          if (shell) return shell;
        }
        return new Response('Hors ligne', { status: 503, statusText: 'Offline' });
      })
  );
});
