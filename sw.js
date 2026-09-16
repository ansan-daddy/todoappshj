importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase 앱 초기화
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

// 1. 백그라운드 메시지 수신 핸들러
// 브라우저/OS가 notification 객체를 보고 자동으로 알림 1개를 표시하므로, 
// 여기서 showNotification을 중복 호출하지 않습니다. (중복 방지 핵심)
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] 백그라운드 FCM 메시지 수신:', payload);
});

// 2. index.html 등 클라이언트에서 직접 알림 요청을 보냈을 때 수신 (SHOW_NOTIFICATION)
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

// 3. 알림 클릭(터치) 시 해당 항목 이동 및 앱 포커스 처리
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
      // 1) 이미 서비스 앱 창이 열려 있는 경우 포커스 후 URL 이동
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // 2) 앱이 완전히 닫혀 있었던 경우 새 창(탭)으로 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
