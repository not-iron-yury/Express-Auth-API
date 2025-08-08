export class HttpException extends Error {
  status: number;
  details?: any;

  constructor(mesage: string, status: number, details?: any) {
    super(mesage);
    this.status = status;
    this.details = details;
  }
}
