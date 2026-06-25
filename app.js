const http = require('http')
require(".env");

const port = process.env.Port || 8080;

// Создание HTTP-сервера для обработки SOAP и WebSocket.
const server = http.createServer((req, res) => {
  res.writeHead(404, {'Content-Type': 'text/plain'})
  res.end('Не найдено')
})

server.listen(port, () =>{
  console.log("Прокси-сервер запущен по http://localhost:8080")
})