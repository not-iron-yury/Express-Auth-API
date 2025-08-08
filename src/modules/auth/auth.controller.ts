import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { RegisterDto } from "./auth.dto";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    // const dto = Object.assign(RegisterDto, req.body)
    const dto = plainToInstance(RegisterDto, req.body); // создаем экземпляр dto через class-transformer
    const errors = await validate(dto); // валидируем dto через class-validator

    // если dto не валидно - обрабатываем ошибки
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    // если dto валидно - пробуем выполнить регистрацию
    try {
      const user = await authService.register(dto.email, dto.password);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
