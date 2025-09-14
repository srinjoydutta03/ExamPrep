(await import("dotenv")).default.config();
//console.log(process.env.DATABASE_URI);
(await import("mongoose")).default.connect(process.env.DATABASE_URI);
import api from "./controllers/api.js";
import express from "express";
import session from "express-session";
import cors from "cors";
import ConnectMongoDBSession from "connect-mongodb-session";

const cookieOptions = { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 * 7 };
const PORT = process.env.PORT ? Number(process.env.PORT) : 3500;
const app = express();

//Logger
app.use((req, res, next) => {
  const path = req.path;
  const origin = req.headers.origin || "<no origin>";
  console.log("Incoming", req.ip, origin, req.method, path);
  res.once("finish", () => {
    console.log("Finished responding to", req.ip, origin, req.method, path);
  });
  next();
});

//CORS config
const cors_whitelist = new Set([
  "http://localhost:5500",
  "http://localhost:3500",
  "http://localhost:4173",
  "http://localhost:5173",
  "https://en.wikipedia.org",
]);
const cors_options = {
  origin: (origin, callback) => {
    if (!origin || cors_whitelist.has(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || cors_whitelist.has(origin))
    res.header("Access-Control-Allow-Credentials", true);
  next();
});
app.use(cors(cors_options));

//Session management
const MongoDBSessionStore = ConnectMongoDBSession(session);
const store = new MongoDBSessionStore({
  uri: process.env.DATABASE_URI,
  collection: "sessions",
});
const sessionManager = session({
  secret: process.env.TOKEN_SECRET || "Enter Secret Here!",
  cookie: cookieOptions,
  store: store,
  resave: false,
  saveUninitialized: false,
});
app.use(sessionManager);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Default path
app.get(/^\/(index(\.htm|\.html)?)?$/, (_, res) =>
  res.contentType("text/plain").status(200).send("Working normally.")
);

//Main API routes
app.use("/", api);

const appServer = app.listen(PORT, () =>
  console.log("Server listening on port", PORT)
);
