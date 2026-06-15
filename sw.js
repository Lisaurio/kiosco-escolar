const CACHE = 'kiosco-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(c => c || fetch(event.request))
  );
});
