// Minimal offline-first cache for HLF Escape Pod.
// Bump CACHE_NAME whenever shipped assets change so clients pick up updates.
const CACHE_NAME = 'hlf-escape-pod-v0.3r';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './touch-controls.js',
  './three.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // Cache same-origin successful responses for next time.
        if (resp.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
