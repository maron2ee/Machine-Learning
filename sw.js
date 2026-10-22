const CACHE = 'jp-couple-v17';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
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
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isApp = req.mode === 'navigate'
    || url.origin === self.location.origin
    && (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json'));

  if (isApp) {
    /* network first, so a new lesson shows up as soon as it is deployed;
       the cache is only the offline fallback */
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    /* the CDN libraries never change, so serve them from cache */
    e.respondWith(caches.match(req).then(c => c || fetch(req)));
  }
});
