import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "Не корректный email" })
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}
