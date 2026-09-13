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

// 백그라운드 상태 수신 리스너
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || 'https://cdn-icons-png.flaticon.com/512/906/906334.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
