const CACHE = 'tasko-v2';
const FILES = [
  '/',
  '/index.html',
  '/script.js',
  '/site.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/css/base.css',
  '/css/header.css',
  '/css/chips.css',
  '/css/tasks.css',
  '/css/empty.css',
  '/css/bottom-nav.css',
  '/css/modal.css',
];

/* ── INSTALL — cache all files on first load ──────────────── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE — delete old caches ────────────────────────── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH — serve cache first, fallback to network ──────── */
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;

        // Not in cache — fetch from network and cache it
        return fetch(e.request)
          .then(response => {
            // Only cache valid responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, copy));
            return response;
          })
          .catch(() => {
            // Offline fallback — return index.html for navigation requests
            if (e.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});