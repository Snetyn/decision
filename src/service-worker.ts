// Basic manual service worker for offline caching
const CACHE = 'decision-jar-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (e: any) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (e: any) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e: any) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => cached || new Response('Offline', { status: 200 })))
  );
});
