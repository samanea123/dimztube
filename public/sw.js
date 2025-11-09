self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pastikan tidak menghentikan audio stream
  if (event.request.destination === 'audio' || event.request.destination === 'video') {
    return;
  }
  // Untuk permintaan lain, kita bisa menambahkan strategi caching di sini nanti.
  // Untuk saat ini, kita biarkan browser menanganinya secara default.
});
