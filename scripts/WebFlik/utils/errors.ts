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

export class InvalidElementError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidElementError';
  }
}

export class InvalidEntranceAttempt extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEntranceAttempt'
  }
}

export class InvalidPhasePositionError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhasePositionError';
  }
}

export class ChildPlaybackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChildPlaybackError';
  }
}

export const errorTip = (tip: string) => {
  return `\n${'*'.repeat(10)}\n${tip}\n${'*'.repeat(10)}`;
};
