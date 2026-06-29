const webSocket = require('ws')
const db = require('../db/queries')

// переменная для сохранения пользователей, которые будут подключатся.
const users = new Map();

function sendToUser (userId, data) {
  const ws = users.get(userId)
  if(ws && ws.readyState === webSocket.OPEN) {
    ws.send(JSON.stringify(data))
    return true
  }
  return false
}

function webSocketServer (server) {

// подключение сервера
const ws = new webSocket.Server({ server: server, path: '/ws'});

// установка соединения
ws.on("connection", (ws) => {
  console.log("WebSocket соединение пошло")
  // переменная для получения айди авторизированного пользователя
  let userId = null;

  //получение сообщения
  ws.on("message", async (message) => {
    try {
     // обрабатываем Json
     const data = JSON.parse(message)
     console.log("Получили сообщение?", data)
     // проверка того, что сообщение пришло и пользователь прошёл авторизацию
     if (data.type === 'auth') {
      const validateUserId = await db.validateSession(data.sessionToken)
      // если нашёлся токен, значит пользователь авторизован и сохраняем его в map, для успешного подключения пользователей
      if(validateUserId) {
        userId = validateUserId
        users.set(userId, ws)
        ws.send(JSON.stringify({type:'auth', status: 'success', message: 'Пользователь авторизирован'}))
        console.log(`Пользователь ${userId} авторизирован по WebSocket`)
      } else {
        ws.send(JSON.stringify({type: 'auth', status: 'error', message: 'Пользователь не подключен'}))
        ws.close()
      }
      return
     }
     // проверка на то, что пользователь прошёл авторизацию
     if(!userId) {
      ws.send(JSON.stringify({type: 'error', message: 'Пользователь не авторизирован'}))
      return
     }
     // проверка перед отправкой указанного пользователя, которому отправить нужно сообщение или само сообщение
     if(!data.from_user_id || !data.text) {
      ws.send(JSON.stringify({type: 'error', message:'Отсутствует текст или отправитель'}))
      return
     }

     const savedMessage = await db.saveMessage(userId, data.from_user_id, data.text)

     ws.send(JSON.stringify({type:'delivery_ack', messageId: savedMessage.message_id, sent_at: savedMessage.sent_at}))
     //структуру отправленного сообщения
     const deliveredMessage = sendToUser(data.from_user_id, {
      type: 'incoming_message',
      message: {
        message_id: savedMessage.message_id,
        from_user_id: savedMessage.from_user_id,
        to_send_user: savedMessage.to_send_user,
        text: savedMessage.text,
        created_at: savedMessage.sent_at
      }
     })
     //если пользователя нет в сети то сообщаем пользователю об этом и сохраняем сообщение
     if(!deliveredMessage) {
      ws.send(JSON.stringify({type:'info', message:'Сообщение сохранено, пользователь находится в оффлайн'}))
     } else {
      ws.send(JSON.stringify({type:'success', message:'Сообщение доставлено пользователю'}))
     }
    } catch (err) {
      console.error("Ошибка обработки WebSocket", err)
      ws.send(JSON.stringify({type:'error', message:'Некорректный JSON или внутреняя ошибка сервера'}))
    }
  });
});

ws.on("close", () => {
  if (userId) {
    users.delete(userId);
    console.log(`Пользователь с айди ${userId} отключен`);
  }
});

ws.on("error", (err) => {
  console.error("WebSocket ошибка:", err);
});

}
console.log(`Работает WebSocket Прокси-сервера по ws://localhost:8080`);

module.exports ={webSocketServer}