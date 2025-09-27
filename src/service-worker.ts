// Enhanced service worker for offline caching & update logic
// Lightweight typing shim (avoids TS lib dependency for ServiceWorkerGlobalScope)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const swSelf: any = self as any;
const CACHE = 'decision-jar-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (e: any) => {
  swSelf.skipWaiting?.();
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (e: any) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => swSelf.clients?.claim?.())
  );
});

self.addEventListener('fetch', (e: any) => {
  const req: Request = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Strategy: static shell -> cache first, others -> stale-while-revalidate
  if (STATIC_ASSETS.includes(url.pathname)) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkRes => {
        caches.open(CACHE).then(cache => cache.put(req, networkRes.clone()));
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
