import { HttpException } from "./HttpException";

export class ConflictException extends HttpException {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}
