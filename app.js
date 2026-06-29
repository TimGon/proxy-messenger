const http = require('http');
const { webSocketServer } = require('./websocket_service/webSocketHandle');
const { createSoapServer } = require('./soap_service/soapHandle');
require("dotenv").config();

const port = process.env.PORT || 8080;

// Создание HTTP-сервера для обработки SOAP и WebSocket.
const server = http.createServer((req, res) => {
  res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'})
  res.end('Не найдено')
})
// запуск обработчика Soap
createSoapServer(server)

// запуск обработчика WebSocket
webSocketServer(server)

server.listen(port, () =>{
  console.log("Прокси-сервер запущен по http://localhost:8080")
})