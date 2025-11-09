self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Don't cache audio/video streams to avoid playback issues.
  if (event.request.destination === 'audio' || event.request.destination === 'video') {
    return;
  }
  
  // For other requests, use a cache-first strategy.
  event.respondWith(
    caches.open('dimztube-cache').then((cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          // Clone the response to cache it and return the original.
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
