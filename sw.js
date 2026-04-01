const CACHE_NAME = 'generation-health-v2';
const ASSETS = [
  '/generation-health/',
  '/generation-health/index.html',
  '/generation-health/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Generation Health', {
      body: data.body || "C'est l'heure du biberon ! 🍼",
      icon: '/generation-health/icon-192.png',
      badge: '/generation-health/icon-192.png',
      tag: 'feeding-reminder',
      renotify: true,
      data: { url: '/generation-health/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/generation-health/');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title || 'Generation Health', {
        body: body || "C'est l'heure du biberon ! 🍼",
        icon: '/generation-health/icon-192.png',
        badge: '/generation-health/icon-192.png',
        tag: 'feeding-reminder',
        renotify: true
      });
    }, delay);
  }

  if (e.data?.type === 'CANCEL_NOTIFICATIONS') {
    self.registration.getNotifications({ tag: 'feeding-reminder' })
      .then(notifs => notifs.forEach(n => n.close()));
  }
});
