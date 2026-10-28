// Service worker do JJ Performance — cache offline do app shell e dos recursos externos (fonte/Chart.js).
const CACHE_VERSION = 'jjp-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch(() => {})
        ).concat(
          EXTERNAL_ASSETS.map((url) =>
            fetch(url, { mode: 'no-cors' })
              .then((res) => cache.put(url, res))
              .catch(() => {})
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);

      if (cached) {
        // Cache-first para resposta imediata offline; atualiza em segundo plano (stale-while-revalidate).
        event.waitUntil(fetchPromise.catch(() => {}));
        return cached;
      }
      return fetchPromise;
    })
  );
});
