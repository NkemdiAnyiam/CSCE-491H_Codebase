import { AnimBlock } from "../AnimBlock";
import { AnimSequence } from "../AnimSequence";
import { AnimTimeline } from "../AnimTimeline";
import { getOpeningTag } from "./helpers";

export type BlockErrorGenerator = {
  <TError extends Error>(error: TError): TError;
  <TError extends Error>(ErrorClass: new (message: string) => TError, msg: string): TError;
};

export type GeneralErrorGenerator = {
  <TError extends Error>(
    ErrorClassOrInstance: TError | (new (message: string) => TError),
    msg: string,
    components?: {timeline?: AnimTimeline, sequence?: AnimSequence, block?: AnimBlock}): TError;
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

export const generateError: GeneralErrorGenerator = (ErrorClassOrInstance, msg = '<unspecified error>', components = {}) => {
  const {timeline, sequence, block} = components!;
  const postfix = (
    `\n\n${'-'.repeat(25)}LOCATION${'-'.repeat(25)}` +
    (timeline
      ? `\nTimeline: [Timeline Name: ${timeline.config.timelineName}]` +
        (sequence ? `\n          [At Index ${timeline.findSequenceIndex(sequence!)}]` : '') +
        ((sequence || block) ? `\n${'-'.repeat(20)}` : '')
      : ''
    ) +
    (sequence
      ? `\nSequence: [Tag: ${sequence.tag}] [Description: ${sequence.description}]` +
        (block ? `\n          [At Index ${sequence.findBlockIndex(block!)}]` : '') +
        (block ? `\n${'-'.repeat(20)}` : '')
      : ''
    ) +
    (block
      ? `\nBlock:    [Category: ${block.category}] [Animation: ${block.animName}]` +
        `\nDOM Tag:  ${getOpeningTag(block.domElem)}`
      : ''
    ) +
    `\n${'-'.repeat(58)}`
  );
  if (ErrorClassOrInstance instanceof Error) {
    ErrorClassOrInstance.message += postfix;
    return ErrorClassOrInstance;
  }
  return new ErrorClassOrInstance(`${msg}` + postfix);
};
