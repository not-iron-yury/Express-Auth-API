import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BadRequestException } from "../errors/BadRequestException";

export async function validateDto<T extends object>(
  dtoClass: new (...args: any[]) => T,
  body: any
): Promise<T> {
  const dto = plainToInstance(dtoClass, body); // создаем экземпляр dto через class-transformer
  const errors = await validate(dto); // валидируем dto через class-validator

  // если dto не валидно
  if (errors.length > 0) {
    throw new BadRequestException(
      "Validation failed",
      errors.map((e) => ({
        property: e.property,
        constraints: e.constraints,
      }))
    );
  }

  return dto;
}
