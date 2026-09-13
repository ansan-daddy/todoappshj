importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

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

// 백그라운드 메시지 수신 리스너
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
    data: payload.data || {} //itemId 및 tab 정보 전달
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭(터치) 시 해당 항목 이동 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const itemId = event.notification.data ? event.notification.data.itemId : null;
  const itemTab = event.notification.data ? event.notification.data.tab : 'all';
  
  let targetUrl = self.location.origin + '/index.html';
  if (itemId) {
    targetUrl += `?itemId=${itemId}&tab=${itemTab}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 앱이 열려 있는 경우 포커스 후 URL 이동
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // 앱이 꺼져 있던 경우 새 창으로 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
