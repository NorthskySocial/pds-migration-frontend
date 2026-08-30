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

// Errors adapted from pds-migration repo

export enum MIGRATION_BACKEND_ERRORS {
  Validation = "VALIDATION_ERROR",
  Upstream = "UPSTREAM_ERROR",
  Runtime = "RUNTIME_ERROR",
  Authentication = "AUTHENTICATION_ERROR",
  Unknown = "UNKNOWN_ERROR",
}

export type MigrationBackendErrorResponse = {
  code: MIGRATION_BACKEND_ERRORS;
  message: string;
};

export class MigrationBackendAPIError extends Error {
  name = this.constructor.name;
  code: MIGRATION_BACKEND_ERRORS = MIGRATION_BACKEND_ERRORS.Unknown;
  response: MigrationBackendErrorResponse;
  status = 500;
  message =
    "Unknown backend error; please send the following log detail to the Northsky team.";
  constructor(response: MigrationBackendErrorResponse) {
    super();
    this.response = response;
  }
}

export class MigrationBackendValidationError extends MigrationBackendAPIError {
  code = MIGRATION_BACKEND_ERRORS.Validation;
  status = 400;
  message = `There's a problem with something you've entered, please check the ${this.response.message} field below.`;
}

export class MigrationBackendUpstreamError extends MigrationBackendAPIError {
  code = MIGRATION_BACKEND_ERRORS.Upstream;
  status = 502;
  message = `Something's wrong with our systems. Please send the below log to our devs — thank you!`;
}

export class MigrationBackendRuntimeError extends MigrationBackendAPIError {
  code = MIGRATION_BACKEND_ERRORS.Runtime;
  status = 400; // @TODO ????
  message = `Something's wrong with our systems. Please send the below log to our devs — thank you!`;
}

export class MigrationBackendAuthenticationError extends MigrationBackendAPIError {
  code = MIGRATION_BACKEND_ERRORS.Authentication;
  status = 401;
  message = `Something's wrong with your credentials. Please check you've entered them correctly.`;
}
