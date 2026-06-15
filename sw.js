const CACHE_NAME = 'kiosco-v3';
const ASSETS = [
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/auth.js',
  'js/api.js',
  'js/db.js',
  'js/pages/login.js',
  'js/pages/register.js',
  'js/pages/padre/dashboard.js',
  'js/pages/padre/hijos.js',
  'js/pages/padre/cargar-saldo.js',
  'js/pages/padre/historial.js',
  'js/pages/padre/configuracion.js',
  'js/pages/alumno/dashboard.js',
  'js/pages/alumno/qr.js',
  'js/pages/kiosquero/dashboard.js',
  'js/pages/kiosquero/escanear.js',
  'js/pages/kiosquero/buscar.js',
  'js/pages/kiosquero/ventas.js',
  'js/pages/admin/dashboard.js',
  'js/pages/admin/escuelas.js',
  'js/pages/admin/kioscos.js',
  'js/pages/admin/usuarios.js',
  'js/pages/admin/productos.js',
  'js/pages/admin/reportes.js',
  'assets/icons/icon-192.svg',
  'assets/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
