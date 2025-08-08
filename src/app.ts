import dotenv from "dotenv";
import express from "express";
import authRouter from "./modules/auth/auth.routes";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/auth", authRouter); // app.use(базовый путь, набор маршрутов)

export default app;
