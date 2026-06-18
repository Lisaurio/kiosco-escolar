const CACHE_NAME = 'kiosco-v5';
const ASSETS = [
  '/kiosco-escolar/css/styles.css',
  '/kiosco-escolar/js/app.js',
  '/kiosco-escolar/js/auth.js',
  '/kiosco-escolar/js/api.js',
  '/kiosco-escolar/js/firebase-config.js',
  '/kiosco-escolar/js/pages/login.js',
  '/kiosco-escolar/js/pages/register.js',
  '/kiosco-escolar/js/pages/padre/dashboard.js',
  '/kiosco-escolar/js/pages/padre/hijos.js',
  '/kiosco-escolar/js/pages/padre/cargar-saldo.js',
  '/kiosco-escolar/js/pages/padre/historial.js',
  '/kiosco-escolar/js/pages/padre/configuracion.js',
  '/kiosco-escolar/js/pages/alumno/dashboard.js',
  '/kiosco-escolar/js/pages/alumno/qr.js',
  '/kiosco-escolar/js/pages/kiosquero/dashboard.js',
  '/kiosco-escolar/js/pages/kiosquero/escanear.js',
  '/kiosco-escolar/js/pages/kiosquero/buscar.js',
  '/kiosco-escolar/js/pages/kiosquero/ventas.js',
  '/kiosco-escolar/js/pages/admin/dashboard.js',
  '/kiosco-escolar/js/pages/admin/escuelas.js',
  '/kiosco-escolar/js/pages/admin/kioscos.js',
  '/kiosco-escolar/js/pages/admin/usuarios.js',
  '/kiosco-escolar/js/pages/admin/productos.js',
  '/kiosco-escolar/js/pages/admin/reportes.js',
  '/kiosco-escolar/assets/icons/icon-192.svg',
  '/kiosco-escolar/assets/icons/icon-512.svg',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'
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
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('index.html')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
