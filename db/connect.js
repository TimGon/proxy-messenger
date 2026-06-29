const { Pool} = require('pg')
require('dotenv').config()

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    max: 20,
    idleTimeoutMillis: 60000, // Закрытие соединение после 60 секунд простоя
    connectionTimeoutMillis: 2000 // 2 секунды при ожидании соединения
})

// pool.on('connect', () => console.log('Подключен к PostgreSQL'))
// pool.on('error', (err) => console.error('Ошибка при подключении', err))

module.exports = pool