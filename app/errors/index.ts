import type { ErrorType } from "~/sessions.server";

export class BaseAppError extends Error {
  errorType: ErrorType;

  constructor(message: string, errorType: ErrorType = "Unexpected") {
    super(message);
    this.name = this.constructor.name;
    this.errorType = errorType;
  }
}

export class CreateAccountError extends BaseAppError {
  constructor(message: string, errorType: ErrorType = "Unexpected") {
    super(message, errorType);
  }
}

export class MigrationError extends BaseAppError {
  constructor(message: string, errorType: ErrorType = "Unexpected") {
    super(message, errorType);
  }
}

export class LoginError extends BaseAppError {
  constructor(message: string, errorType: ErrorType = "Expected") {
    super(message, errorType);
  }
}
