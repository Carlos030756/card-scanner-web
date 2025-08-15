self.addEventListener('install', event => {
  event.waitUntil(caches.open('csw-v1').then(c => c.addAll(['/','/index.html','/script.js','/manifest.json'])));
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
