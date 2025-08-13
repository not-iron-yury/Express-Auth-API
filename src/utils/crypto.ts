import crypto from "crypto";

// Вычисляет HMAC (Hash-based Message Authentication Code) с использованием алгоритма SHA-256
// и возвращает результат в виде шестнадцатеричной строки (hex).
export function hmacSha256Hex(secret: string, value: string) {
  return crypto
    .createHmac("sha256", secret) // создает объект HMAC с алгоритмом шифрования "sha256" и указанным секретным ключом (secret)
    .update(value) // применяет обновление хэша к указанному значению (value) для вычисления итогового хэша
    .digest("hex"); // возвращает финальный результат в виде шестнадцатеричного представления ("hex")
}
