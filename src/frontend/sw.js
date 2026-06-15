const CACHE_NAME = 'kiosco-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/db.js',
  '/js/pages/login.js',
  '/js/pages/register.js',
  '/js/pages/padre/dashboard.js',
  '/js/pages/padre/hijos.js',
  '/js/pages/padre/cargar-saldo.js',
  '/js/pages/padre/historial.js',
  '/js/pages/padre/configuracion.js',
  '/js/pages/alumno/dashboard.js',
  '/js/pages/alumno/qr.js',
  '/js/pages/kiosquero/dashboard.js',
  '/js/pages/kiosquero/escanear.js',
  '/js/pages/kiosquero/buscar.js',
  '/js/pages/kiosquero/ventas.js',
  '/js/pages/admin/dashboard.js',
  '/js/pages/admin/escuelas.js',
  '/js/pages/admin/kioscos.js',
  '/js/pages/admin/usuarios.js',
  '/js/pages/admin/productos.js',
  '/js/pages/admin/reportes.js',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('push', event => {
  let data = { titulo: 'Kiosco Escolar', mensaje: '' };
  if (event.data) {
    try { data = event.data.json(); } catch { data.mensaje = event.data.text(); }
  }

  const options = {
    body: data.mensaje,
    icon: '/assets/icons/icon-192.svg',
    badge: '/assets/icons/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'kiosco-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.titulo, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
