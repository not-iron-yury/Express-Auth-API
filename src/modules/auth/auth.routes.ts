import { Router } from "express";
import { authGuard } from "../common/guards/auth.guard";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/register", controller.register.bind(controller));
// Метод register передаётся в качестве обработчика маршрута, и его контекст (this) становится неопределённым
// Привязка методом .bind(controller) гарантирует, что внутри метода register значение this всегда будет указывать
// именно на экземпляр контроллера (controller), позволяя корректно обращаться к его внутренним данным и методам.

router.post("/login", controller.login.bind(controller));

router.get("/me", authGuard, (req, res) => {
  res.json({ user: req.user });
});

export default router;
