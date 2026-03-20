// نور الكلمة القرآنية — Service Worker v1.0
const CACHE = 'nk-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap'
];

// Installation — mise en cache des assets essentiels
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — stratégie : cache d'abord, réseau en fallback
self.addEventListener('fetch', e => {
  // Ne pas intercepter les appels API Anthropic et audio
  if (e.request.url.includes('api.anthropic.com') ||
      e.request.url.includes('cdn.islamic.network') ||
      e.request.url.includes('whop.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback : retourner la page principale
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
