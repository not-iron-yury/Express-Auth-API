import bcrypt from "bcrypt";
import { ConflictException } from "../common/errors/ConflictException";
import prisma from "../prisma/client";

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
}
