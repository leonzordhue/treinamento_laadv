/* Service Worker — Portal LAADV (TASK-26)
   Estratégia: cache-first para o shell estático; network-only para Firebase.
   AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: SW */

const CACHE = 'laadv-shell-v1';
const SHELL = [
  '/treinamento_laadv/',
  '/treinamento_laadv/index.html',
];

// Origens que NUNCA devem ser cacheadas (dados ao vivo)
const NO_CACHE = [
  'firebaseio.com',
  'googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Nunca cachear Firebase ou Google APIs
  if (NO_CACHE.some(host => url.hostname.includes(host))) return;

  // Cache-first para navegação (index.html)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/treinamento_laadv/index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  // Stale-while-revalidate para fontes e assets estáticos
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached => {
          const net = fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; });
          return cached || net;
        })
      )
    );
  }
});
