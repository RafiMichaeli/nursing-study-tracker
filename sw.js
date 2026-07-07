// sw.js — service worker: network-first with cache fallback.
// Online → always the freshest deploy (no cache-version bookkeeping needed).
// Offline → last-seen copy of everything, including CDN assets (fonts, Chart.js).
const CACHE = 'nursing-tracker-v1';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './schedule.css',
  './app.js',
  './data.js',
  './links.js',
  './schedule.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful (incl. opaque CDN) responses for offline use
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then(
          (hit) => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
