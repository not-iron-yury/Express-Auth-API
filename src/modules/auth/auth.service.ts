import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ConflictException } from "../common/errors/ConflictException";
import { UnauthorizedException } from "../common/errors/UnauthorizedException";
import prisma from "../prisma/client";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = "1h";

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
    const data = { email, password: hashedPassword };
    const user = await prisma.user.create({ data });

    // возвр. структурированных данных
    return { id: user.id, email: user.email };
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

    // создаем access token, если все заебумба
    const payload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_IN,
    });

    return { accessToken: token };
  }
}
