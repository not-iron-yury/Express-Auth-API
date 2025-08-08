import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Не корректный email" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Пароль должен быть минимум из 6 символов" })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Не корректный email" })
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
