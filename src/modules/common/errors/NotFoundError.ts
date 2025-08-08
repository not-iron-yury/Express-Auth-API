import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
  constructor(message = "NotFound") {
    super(message, 404);
  }
}
