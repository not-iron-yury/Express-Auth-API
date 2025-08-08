import { HttpException } from "./HttpException";

export class BadRequestException extends HttpException {
  constructor(message = "Bad request", details?: any) {
    super(message, 400, details);
  }
}
