export type ErrorGenerator = {
  <TError extends Error>(error: TError): TError;
  <TError extends Error>(ErrorClass: new (message: string) => TError, msg: string): TError;
};

export class CommitStylesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommitStylesError';
  }
}

export class InvalidElementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidElementError';
  }
}
