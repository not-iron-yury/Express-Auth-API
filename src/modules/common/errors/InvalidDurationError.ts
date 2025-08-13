export class InvalidDurationError extends Error {
  constructor(message = "Invalid duration format") {
    super(message);
    this.name = "InvalidDurationError";
  }
}
