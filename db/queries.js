const pool = require('./connect')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const hashPass = async (password) => {
    // шифрование пароля происходит на 10 итерациях
    return await bcrypt.hash(password, 10) 
}

const comparePass = async (password, hash) => {
    // сравнение паролей c зашифрованным из базы данных
    return await bcrypt.compare(password, hash)
}

const createUser = async (login, password) => {
    const hashed = await hashPass(password)
    // запрос с параметризации и возвращения айди и логина для ответа на postman
    const query = `
    INSERT INTO users(login, password_hash) VALUES ($1, $2) RETURNING user_id, login
    `
    const res = pool.query(query, [login, hashed])
    return res.rows[0]
}

const findLoginByUser = async (login) => {
    const query = `SELECT id, login, password_hash FROM users WHERE login=$1`
    const res = await pool.query(query, [login])
    return res.rows[0] || null
}

const createSession = async (userId) => {
    const sessionToken = crypto.randomUUID();
    const query = `INSERT INTO sessions (user_id, session_token) VALUES ($1, $2) RETURNING session_token`
    await pool.query(query, [userId, sessionToken])
    return sessionToken;
}

const validateSession = async (sessionToken) => {
    const query=`SELECT user_id FROM sessions WHERE session_token=$1`
    const res = await pool.query(query, [sessionToken])
    return res.row[0] ? res.row[0].userId : null
}

const saveMessage = async (semderId, recieverId, message, sendAt) => {
    const query = `
    INSERT INTO messages (from_user_id, to_user_id, text, sent_at) VALUES($1,$2,$3,$4) 
    RETURNING message_id, from_user_id, to_user_id, text, sent_at`
    const res = await pool.query(query, [semderId, recieverId, message, sendAt])
    return res.rows[0]
}

// получение двух последних сообщений между двумя пользователями
const getMessagesBetweenUsers = async (userOneId, userTwoId, limit=2) => {
    const query = `
    SELECT message_id, from_user_id, to_user_id, text, sent_at FROM messages
    WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
    ORDER BY sent_at DESC LIMIT $3`
    const res = await pool.query(query, [userOneId, userTwoId, limit])
    return res.rows.reverse()
}

module.exports = { createUser, createSession, saveMessage, getMessagesBetweenUsers, validateSession, findLoginByUser, comparePass}