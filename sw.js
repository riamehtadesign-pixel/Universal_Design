// Offline support: the app shell is cached so it opens with no signal at all.
// Bump CACHE when you change any file.
const CACHE = 'pantry-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/match.js',
  'js/ai.js',
  'js/data/catalog.js',
  'js/data/recipes.js',
  'js/data/cookware.js',
  'js/views/home.js',
  'js/views/shelf.js',
  'js/views/buy.js',
  'js/views/kitchen.js',
  'js/views/cook.js',
  'assets/icon.svg',
  'assets/icon-maskable.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;              // never touch API calls
  if (url.pathname.endsWith('/sw.js')) return;

  // Cache first (this app is static), then refresh the copy in the background.
  e.respondWith(
    caches.match(request, { ignoreSearch: true }).then(hit => {
      const live = fetch(request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
        .catch(() => hit || caches.match('index.html'));
      return hit || live;
    })
  );
});
