self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 백그라운드 푸시 알림 메시지 수신 및 발송
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '알림';
    const options = {
      body: event.data.body || '',
      icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
      vibrate: [200, 100, 200],
      tag: 'todo-notification',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// 주기적 백그라운드 동기화 (지원하는 브라우저/환경에서 백그라운드 체크 수행)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-todo-deadline') {
    event.waitUntil(checkDeadlinesInBackground());
  }
});

async function checkDeadlinesInBackground() {
  // 클라이언트(열려 있는 앱 창)에 마감 체크 요청 전송
  const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage({ type: 'TRIGGER_DUE_CHECK' });
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
})
