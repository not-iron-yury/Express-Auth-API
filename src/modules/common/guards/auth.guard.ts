import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const JWT_SECRET = process.env.JWT_SECRET as string;

  // проверяем наличие свойства authorization в заголовке запроса
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Доступ заблокирован: отсутствует токен" });
  }

  // достаем токен из свойства authorization
  const token = authHeader.split(" ")[1];

  // проверям наш токен или нет
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      typeof decoded !== "object" ||
      !("sub" in decoded) ||
      !("email" in decoded)
    ) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token structure" });
    }

    const { sub, email } = decoded as JwtPayload;

    req.user = { id: Number(sub), email: String(email) };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
