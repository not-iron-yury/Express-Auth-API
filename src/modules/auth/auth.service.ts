import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import { type payloadType } from "../../types/payload.type";
import { hmacSha256Hex } from "../../utils/crypto";
import { BadRequestException } from "../common/errors/BadRequestException";
import { ConflictException } from "../common/errors/ConflictException";
import { InvalidDurationError } from "../common/errors/InvalidDurationError";
import { UnauthorizedException } from "../common/errors/UnauthorizedException";
import prisma from "../prisma/client";

const JWT_SECRET = config.jwtSecret;
const REFRESH_TOKEN_SECRET = config.refreshTokenSecret;
const JWT_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

export class AuthService {
  async register(email: string, password: string) {
    // проверка пользователя на существование
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }

    // хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // добавляем данные в БД
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    // создаем оба токена
    const tokens = await this.generateTokens(user.id, user.email);

    // сохраняем refresh токен в БД.
    this.saveRefreshToken(user.id, tokens.refreshToken);

    // возвр. структурированных данных + оба токена
    return { id: user.id, email: user.email, ...tokens };
  }

  async login(email: string, password: string) {
    // проверяем пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Неправильные учетные данные");
    }

    // проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Неправильные учетные данные");
    }

    // создаем оба токена, если все заебумба
    const tokens = await this.generateTokens(user.id, user.email);

    // сохраняем refresh токен в БД.
    this.saveRefreshToken(user.id, tokens.refreshToken);

    // возвщращаем оба токена
    return { ...tokens };
  }

  // генерация access и refresh токенов
  async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  // вычисляет expiresAt и записывает refresh токен в БД
  async saveRefreshToken(
    userId: number,
    refreshToken: string,
    ip?: string,
    userAgent?: string
  ) {
    // хэшируем refreshToken (HMAC-SHA256)
    const tokenHash = hmacSha256Hex(REFRESH_TOKEN_SECRET, refreshToken);

    // вычисляем дату истечения срока годности refresh token
    let expiresAt: Date;
    try {
      const expiresMs = this.parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN); // срок годности refresh токена в миллисекундах
      expiresAt = new Date(Date.now() + expiresMs); // текущая дата + срок годности
    } catch (error) {
      if (error instanceof InvalidDurationError) {
        throw new BadRequestException(
          "Неправильный формат времени жизни refresh token"
        );
      }
      throw error;
    }

    // делаем запись в таблицу refresh_token
    await prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId,
        expiresAt,
        createdByIp: ip,
        deviceInfo: userAgent,
        revoked: false,
      },
    });
  }

  // конвертация строки вида "7d" ("1h") в миллисекунды
  parseDurationToMs(duration: string) {
    // валидация полученного значения
    const match = duration.match(/^(\d)([dh])$/); // две группы совпадений: число и буква (d - day, h - hours)
    if (!match) throw new InvalidDurationError("Invalid duration format");

    const value = parseInt(match[1], 10);
    const unit = match[2];

    // валидация числового значения
    if (!Number.isFinite(value) || value <= 0) {
      throw new InvalidDurationError(
        "Ожидается формат: <число><единица измерения> (например: 1h, 7d)"
      );
    }

    // преобразование и возврат миллисекунд
    switch (unit) {
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new InvalidDurationError("Invalid duration format");
    }
  }

  // выдает новый accessToken по refreshToken
  async refreshTokens(providedRefreshToken: string) {
    if (!providedRefreshToken || typeof providedRefreshToken !== "string") {
      throw new BadRequestException("Refresh token обязателен");
    }

    // 1) верификация предоставленного refreshToken
    let payload: any;
    try {
      jwt.verify(
        providedRefreshToken,
        REFRESH_TOKEN_SECRET
      ) as unknown as payloadType;
    } catch (err) {
      throw new UnauthorizedException("Невалидный refresh token");
    }

    // 2) находим по хэшу в БД (нам нужны для проверки revoked и expiresAt токена)
    const tokenHash = hmacSha256Hex(REFRESH_TOKEN_SECRET, providedRefreshToken); // хэшируем предоставленный refreshToken
    const stored = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException("Refresh token не найден в БД");
    }

    // 3) проверка revoked (отмены)
    // если предоставленный refresh token был отменен (аннулирован), то обновление токенов отменяется
    if (stored.revoked) {
      await prisma.refreshToken
        .delete({
          where: { id: stored.id },
        })
        .catch(() => {});
      throw new UnauthorizedException("Refresh token был отозван");
    }

    // 4) проверка истечения срока годности
    // если истек срок предоставленного refresh token'а, то обновление токенов по предоставленному refresh token отменяется
    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken
        .delete({ where: { id: stored.id } })
        .catch(() => {});
      throw new UnauthorizedException("Истек срок годности Refresh token'а");
    }

    // ---- Если все проверки refresh token'а пройдены ---- //

    // 5) генерация новой пары токенов (rotation)
    const tokens = await this.generateTokens(payload.sub, payload.email);

    // 6) ротация refresh token'а
    await prisma.refreshToken.delete({ where: { id: stored.id } }); // удаляем старый
    await this.saveRefreshToken(payload.sub, tokens.refreshToken); // сохраняем новый

    // 7) возвращаем оба токена
    return tokens;
  }

  // отзыв refresh token
  async revokeRefreshToken(providedRefreshToken: string) {
    if (!providedRefreshToken || typeof providedRefreshToken !== "string") {
      throw new BadRequestException("Не предоставлен refresh token");
    }

    // 1) верификация предоставленного refreshToken (в payload нет необходимости, поэтому только проверка)
    try {
      jwt.verify(providedRefreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new UnauthorizedException("Невалидный refresh token");
    }

    // 2) находим по хэшу в БД (для проверки нужны значения полей revoked и expiresAt)
    const tokenHash = hmacSha256Hex(REFRESH_TOKEN_SECRET, providedRefreshToken); // хэшируем предоставленный refreshToken
    const stored = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException("Refresh token не найден в БД");
    }

    // 3) проверка на revoked (что бы не выполнять лишнее обращение к БД)
    if (stored.revoked) {
      return; // ничего не делаем, т.к. токен уже отозван
    }

    // 4) Помечаем токен как revoked
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return true;
  }
}
