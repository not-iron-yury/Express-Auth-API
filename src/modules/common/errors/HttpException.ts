export class HttpException extends Error {
  status: number;

  constructor(mesage: string, status: number) {
    super(mesage);
    this.status = status;

    // сохраняем имя класса в stack trace
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
