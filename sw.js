importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const CACHE_NAME = 'todoapp-v20260916-force';

// 1. Firebase 앱 초기화
firebase.initializeApp({
  apiKey: "AIzaSyDYTzXhT0nEBFGaKy_RylkGJ28rmhsPqoc",
  authDomain: "sunhong-todo.firebaseapp.com",
  databaseURL: "https://sunhong-todo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sunhong-todo",
  storageBucket: "sunhong-todo.firebasestorage.app",
  messagingSenderId: "382912248399",
  appId: "1:382912248399:web:1294528d4a9e52f47a083a"
});

const messaging = firebase.messaging();

// 2. 서비스 워커 설치 및 기존 캐시 전면 삭제 (캐시 문제 해결 핵심)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => caches.delete(cache))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. index.html 요청 시 항상 네트워크에서 최신 코드 로드
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' || event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 4. FCM 백그라운드 메시지 수신 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] 백그라운드 FCM 메시지 수신:', payload);
});

// 5. 클라이언트 요청 알림 수신 (SHOW_NOTIFICATION)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '알림';
    const options = {
      body: event.data.body || '',
      icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
      data: event.data.data || {}
    };
    self.registration.showNotification(title, options);
  }
});

// 6. 알림 클릭 시 해당 항목 이동 및 앱 포커스 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const itemId = notificationData.itemId || null;
  const itemTab = notificationData.tab || 'all';

  let targetUrl = self.location.origin + '/index.html';
  if (itemId) {
    targetUrl += `?itemId=${itemId}&tab=${itemTab}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
