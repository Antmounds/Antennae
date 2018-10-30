const cacheName = 'antennaeCache';
const filesToCache = [
  '/',
  '/android-icon-192x192.png',
  '/favicon.ico?v=1',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-96x96.png',
  '/manifest.json',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Bold.woff',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Bold.woff2',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Light.woff',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Light.woff2',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Medium.woff',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Medium.woff2',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Regular.woff',
  '/packages/materialize_materialize/fonts/roboto/Roboto-Regular.woff2'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});