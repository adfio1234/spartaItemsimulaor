import express from "express";
import cookieParser from "cookie-parser";
import AccountRouter from "./routes/account.router.js";
import CharacterRouter from "./routes/character.router.js";
//import CommentsRouter from "./routes/comments.router.js";
//import LogMiddleware from "./middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import expressSession from "express-session";
import expressMySQLSession from "express-mysql-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const MYSQLStore = expressMySQLSession(expressSession);

const sessionStore = new MYSQLStore({
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  expiratio: 1000 * 60 * 60 * 24,
  createDatabaseTable: true,
});

//app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false, //초기화시 저장할거냐
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //1일동안 세션지속
    },
    store: sessionStore, //session사용한다고 통보
  }),
);

app.use("/api", [AccountRouter,CharacterRouter]);

app.use(ErrorHandlingMiddleware);
app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
