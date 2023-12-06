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
