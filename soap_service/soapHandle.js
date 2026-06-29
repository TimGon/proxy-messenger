const fs = require("fs");
const soap = require("soap");
const path = require("path");
const db = require("../db/queries");

const wsdlPath = path.join(__dirname, "wsdl.xml");
const wsdlXml = fs.readFileSync(wsdlPath, "utf-8");

// основная обработка следующих операций: авторизации, регистрации и получение истории сообщений
const serviceSoap = {
  proxyMessengerService: {
    proxyMessengerPort: {
      login: async (args) => {
        const { login, password } = args;
        try {
          const user = await db.findLoginByUser(login);
          if (!user) {
            return { success: false, message: "Данного логина не существует" };
          }
          const validate = await db.comparePass(password, user.password_hash);
          if (!validate) {
            return { success: false, message: "Данный пароль неверный" };
          }
          const sessionToken = await db.createSession(user.user_id);
          if (sessionToken) {
            return { success: true, message: "Авторизация прошла успешна", sessionToken: sessionToken};
          }
        } catch (err) {
          console.error("Ошибка сервера", err);
          return { success: false, message: "Внутренняя ошибка сервера" };
        }
      },
      register: async (args) => {
        const { login, password } = args;
        try {
          const existingUser = await db.findLoginByUser(login);
          if (existingUser) {
            return {
              success: false,
              message: "Пользователь с таким логином существует",
            };
          }
          await db.createUser(login, password);
          return {
            success: true,
            message: "Пользователь успешно зарегестрирован",
          };
        } catch (err) {
          console.error("Ошибка сервера", err);
          return { success: false, message: "Внутренняя ошибка сервера" };
        }
      },
      getHistory: async (args) => {
        const { sessionToken, otherUserId, limit } = args;
        try {
          const validateUserId = await db.validateSession(sessionToken);
          if (!validateUserId) {
            return { error: "Недействительная сессия" };
          }
          const messages = await db.getMessagesBetweenUsers(
            validateUserId,
            otherUserId,
            limit || 2,
          );
          const messageList = messages.map((m) => ({
            message_id: m.message_id,
            from_user_id: m.from_user_id,
            send_user_id: m.send_user_id,
            text: m.text,
            sent_at: m.sent_at.toISOString(),
          }));
          return { messages: { message: messageList } };
        } catch (err) {
          console.error("Ошибка GetHistory", err);
          return { error: "Внутренняя ошибка сервера" };
        }
      },
    },
  },
};

const createSoapServer = (httpServer) => {
  soap.listen(httpServer, "/soap", serviceSoap, wsdlXml, () => {
    console.log("Сервер запущен на /soap");
  });
};

module.exports = {createSoapServer}