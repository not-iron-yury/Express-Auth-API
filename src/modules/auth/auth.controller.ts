import { Request, Response } from "express";
import { HttpException } from "../common/errors/HttpException";
import { validateDto } from "../common/validators/validate-dto";
import { LoginDto, RegisterDto } from "./auth.dto";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const dto = await validateDto(RegisterDto, req.body); // валидируем DTO
      const user = await authService.register(dto.email, dto.password);
      res.status(201).json(user);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const dto = await validateDto(LoginDto, req.body); // валидируем DTO
      const result = await authService.login(dto.email, dto.password);
      res.status(200).json(result);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async refreshTokens(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res
          .status(400)
          .json({ message: "Не предоставлен refresh token" });
      }

      const tokens = await authService.refreshTokens(refreshToken);
      return res.status(200).json(tokens);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res
          .status(400)
          .json({ message: "Не предоставлен refresh token" });
      }

      await authService.revokeRefreshToken(refreshToken);
      return res.status(200).json({ message: "Logout done" });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // обработка ошибок
  private handleError(error: any, res: Response) {
    // если кастомное исплючение
    if (error instanceof HttpException) {
      return res
        .status(error.status)
        .json({ message: error.message, details: error.details });
    }
    // если неожиданная ошибка
    console.error(error); // логгируем
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
