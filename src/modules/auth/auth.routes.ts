import { Router } from "express";
import { authGuard } from "../common/guards/auth.guard";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register.bind(authController));
// Метод register передаётся в качестве обработчика маршрута, и его контекст (this) становится неопределённым
// Привязка методом .bind(authController) гарантирует, что внутри метода register значение this всегда будет указывать
// именно на экземпляр контроллера (authController), позволяя корректно обращаться к его внутренним данным и методам.

router.post("/login", authController.login.bind(authController));
router.post("/refresh", authController.refreshTokens.bind(authController));
router.post("/logout", authController.logout.bind(authController));

router.get("/me", authGuard, (req, res) => {
  res.json({ user: req.user });
});

export default router;
