const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sunhong-todo-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function checkAndSendNotifications() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const usersSnapshot = await db.ref('users').once('value');
  const todosSnapshot = await db.ref('todos').once('value');
  const routinesSnapshot = await db.ref('routines').once('value');
  
  if (!usersSnapshot.exists()) return;

  const users = usersSnapshot.val();
  const todos = todosSnapshot.exists() ? todosSnapshot.val() : {};
  const routines = routinesSnapshot.exists() ? routinesSnapshot.val() : {};

  for (const username of Object.keys(users)) {
    const userFcmToken = users[username]?.fcmToken;
    if (!userFcmToken) continue;

    // 1. 일반 할 일 체크
    const userTodos = todos[username] || [];
    for (const todo of Object.values(userTodos)) {
      const hasSub = todo.subitems && todo.subitems.length > 0;
      
      if (!hasSub && !todo.completed && todo.due) {
        await processItemDue(todo, userFcmToken, username, `todos/${username}/${todo.id}`, now);
      }
      
      if (hasSub) {
        for (const sub of Object.values(todo.subitems)) {
          if (!sub.completed && sub.due) {
            await processItemDue(sub, userFcmToken, username, `todos/${username}/${todo.id}/subitems/${sub.id}`, now, true);
          }
        }
      }
    }

    // 2. 루틴 체크
    const userRoutines = routines[username] || [];
    for (const routine of Object.values(userRoutines)) {
      if (routine.lastCompletedDate === todayStr || !routine.dueTime) continue;

      const routineTime = new Date(`${todayStr}T${routine.dueTime}`);
      const diffMinutes = (routineTime - now) / (1000 * 60);

      if (diffMinutes > 0 && diffMinutes <= 15 && !routine.notified10m) {
        await sendFcmNotification(userFcmToken, '⏰ 루틴 수행 10분 전!', `[루틴] ${routine.task} 수행 10분 전입니다.`, routine.id, 'routine');
        await db.ref(`routines/${username}/${routine.id}/notified10m`).set(true);
      } else if (diffMinutes <= 0 && diffMinutes >= -15 && !routine.notified) {
        await sendFcmNotification(userFcmToken, '🚨 루틴 수행 시간입니다!', `[루틴] ${routine.task} 수행 시각이 되었습니다.`, routine.id, 'routine');
        await db.ref(`routines/${username}/${routine.id}/notified`).set(true);
      }
    }
  }
}

async function processItemDue(item, token, username, dbPath, now, isSub = false) {
  const dueTime = new Date(item.due);
  const diffMinutes = (dueTime - now) / (1000 * 60);
  const prefix = isSub ? '[하위]' : `[${item.category || '할일'}]`;

  if (diffMinutes > 0 && diffMinutes <= 15 && !item.notified10m) {
    await sendFcmNotification(token, '⏰ 마감 10분 전!', `${prefix} ${item.task} 마감 10분 전입니다.`, item.id, 'all');
    await db.ref(`${dbPath}/notified10m`).set(true);
  } else if (diffMinutes <= 0 && diffMinutes >= -15 && !item.notified) {
    await sendFcmNotification(token, '🚨 마감 시간이 되었습니다!', `${prefix} ${item.task} 마감 시각이 되었습니다.`, item.id, 'all');
    await db.ref(`${dbPath}/notified`).set(true);
  }
}

async function sendFcmNotification(token, title, body, itemId, tab) {
  try {
    await admin.messaging().send({
      token: token,
      notification: { title, body },
      data: {
        itemId: String(itemId),
        tab: String(tab)
      },
      webpush: {
        notification: {
          icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png'
        }
      }
    });
    console.log(`[FCM 성공] ${title} - ${body}`);
  } catch (err) {
    console.error(`[FCM 오류]`, err.message);
  }
}

checkAndSendNotifications().then(() => process.exit(0));
