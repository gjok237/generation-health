const CACHE_NAME = 'generation-health-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// ─── INSTALL ───
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ─── ACTIVATE ───
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── FETCH (cache first) ───
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ─── PUSH NOTIFICATION ───
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Generation Health', {
      body: data.body || "C'est l'heure du biberon ! 🍼",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'feeding-reminder',
      renotify: true,
      requireInteraction: false,
      data: { url: '/' }
    })
  );
});

// ─── NOTIFICATION CLICK ───
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// ─── SCHEDULED LOCAL NOTIFICATIONS ───
// Triggered by the app via postMessage
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title || 'Generation Health', {
        body: body || "C'est l'heure du biberon ! 🍼",
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'feeding-reminder',
        renotify: true,
        requireInteraction: false
      });
    }, delay);
  }

  if (e.data?.type === 'CANCEL_NOTIFICATIONS') {
    self.registration.getNotifications({ tag: 'feeding-reminder' })
      .then(notifs => notifs.forEach(n => n.close()));
  }
});
