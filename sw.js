const CACHE = 'u2d-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
// Network first so every launch gets the newest version; the cache is only the offline fallback.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r.url, { cache: 'no-store' });
      if (res.ok) { const c = await caches.open(CACHE); c.put(r.url, res.clone()); }
      return res;
    } catch (_) {
      const m = (await caches.match(r.url, { ignoreSearch: true })) || (await caches.match('./index.html'));
      return m || Response.error();
    }
  })());
});
