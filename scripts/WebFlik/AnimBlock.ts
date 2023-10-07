import { AnimSequence } from "./AnimSequence.js";
import { AnimTimeline } from "./AnimTimeline.js";
import { GeneratorParams, IKeyframesBank, KeyframesBankEntry } from "./WebFlik.js";
import { EasingString, getEasing } from "./Presets.js";
import { mergeArrays } from "./utils.js";
// import { presetScrolls } from "./Presets.js";

// TODO: Potentially create multiple extendable interfaces to separate different types of customization
type CustomKeyframeEffectOptions = {
  startsNextBlock: boolean;
  startsWithPrevious: boolean;
  commitsStyles: boolean;
  commitStylesAttemptForcefully: boolean; // attempt to unhide, commit, then re-hide
  composite: CompositeOperation;
  classesToAddOnFinish: string[];
  classesToAddOnStart: string[];
  classesToRemoveOnFinish: string[];
  classesToRemoveOnStart: string[]; // TODO: Consider order of addition/removal
  pregeneratesKeyframes: boolean;
}

type KeyframeTimingOptions = {
  duration: number;
  easing: EasingString;
  playbackRate: number;
  delay: number;
  endDelay: number;
}

export type AnimBlockConfig = KeyframeTimingOptions & CustomKeyframeEffectOptions;

type TOffset = {
  offsetSelfX: CssLength; // determines offset to apply to the respective positional property
  offsetSelfY: CssLength; // determines offset to apply to the respective positional property
}

// CHANGE NOTE: Use strings in the format of <number><CssLengthUnit> and remove XY things
export interface TNoElem extends TOffset {
  translateX: CssLength;
  translateY: CssLength;
}

// TODO: make offset targets CssLengths
export interface TElem extends TOffset {
  // targetElem: Element; // if specified, translations will be with respect to this target element
  alignmentY: CssYAlignment; // determines vertical alignment with target element
  alignmentX: CssXAlignment; // determines horizontal alignment with target element
  offsetTargetX: number; // offset based on target's width (0.5 pushes us 50% of the target element's width rightward)
  offsetTargetY: number; // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  preserveX: boolean; // if true, no horizontal translation with respect to the target element (offsets still apply)
  preserveY: boolean; // if true, no vertical translation with respect to the target element (offsets still apply)
}

type CssLengthUnit = | 'px' | 'rem' | '%';
type CssLength = `${number}${CssLengthUnit}`;
type CssYAlignment = | 'top' | 'bottom'; // TODO: more options?
type CssXAlignment = | 'left' | 'right'; // TODO: more options?

class CommitStylesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommitStylesError';
  }
}



type Segment = [
  endDelay: number,
  callbacks: ((...args: any[]) => void)[],
  roadblocks: Promise<unknown>[],
  integrityblocks: Promise<unknown>[],
  // true when awaiting delay/endDelay periods while the awaited delay/endDelay duration is 0
  skipEndDelayUpdation: boolean,
  header: Partial<{
    completed: boolean,
    activated: boolean,
  }>,
];

type SegmentsCache = [delayPhaseEnd: Segment, activePhaseEnd: Segment, endDelayPhaseEnd: Segment]

export class AnimTimelineAnimation extends Animation {
  private _timelineID: number = NaN;
  private _sequenceID: number = NaN;
  direction: 'forward' | 'backward' = 'forward';
  private getEffect(direction: 'forward' | 'backward'): KeyframeEffect { return direction === 'forward' ? this.forwardEffect : this.backwardEffect; }
  private inProgress = false;
  private isFinished = false;
  // holds list of stopping points and resolvers to control segmentation of animation...
  // to help with Promises-based sequencing
  private segmentsForward: Segment[] = [];
  private segmentsForwardCache: SegmentsCache;
  private segmentsBackward: Segment[] = [];
  private segmentsBackwardCache: SegmentsCache;

  private isExpediting = false;
  
  onDelayFinish: Function = () => {};
  onActiveFinish: Function = () => {};
  onEndDelayFinish: Function = () => {};
  // FIXME: The behavior for pausing for roadblocks while expedition is in act is undefined
  pauseForRoadblocks: Function = () => { throw new Error(`This should never be called before being defined by parent block`); };
  unpauseFromRoadblocks: Function = () => { throw new Error(`This should never be called before being defined by parent block`); };

  get timelineID(): number { return this._timelineID; }
  set timelineID(id: number) { this._timelineID = id; }
  get sequenceID(): number { return this._sequenceID; }
  set sequenceID(id: number) { this._sequenceID = id; }

  constructor(private forwardEffect: KeyframeEffect, private backwardEffect: KeyframeEffect) {
    super();

    if (!this.forwardEffect.target) { throw new Error(`Animation target must not be null or undefined`); }
    if (this.forwardEffect.target !== backwardEffect.target) { throw new Error(`Forward and backward keyframe effects must target the same element`); }
    
    this.setDirection('forward');
    this.resetPhases('both');
    this.segmentsForwardCache = [...this.segmentsForward] as SegmentsCache;
    this.segmentsBackwardCache = [...this.segmentsBackward] as SegmentsCache;
  }
  
  setForwardFrames(frames: Keyframe[]): void {
    this.forwardEffect.setKeyframes(frames);
    (super.effect as KeyframeEffect).setKeyframes(frames);
  }

  setBackwardFrames(frames: Keyframe[], backwardIsMirror?: boolean): void {
    this.backwardEffect.setKeyframes(frames);
    this.backwardEffect.updateTiming({direction: backwardIsMirror ? 'reverse' : 'normal'});
    (super.effect as KeyframeEffect).setKeyframes(frames);
  }

  setForwardAndBackwardFrames(forwardFrames: Keyframe[], backwardFrames: Keyframe[], backwardIsMirror?: boolean): void {
    this.setForwardFrames(forwardFrames);
    this.setBackwardFrames(backwardFrames, backwardIsMirror);
    (super.effect as KeyframeEffect).setKeyframes(forwardFrames);
  }

  setDirection(direction: 'forward' | 'backward') {
    this.direction = direction;

    // Load proper KeyframeEffect
    // The deep copying circumvents a strange Firefox bug involving reusing effects
    switch(direction) {
      case "forward":
        const forwardEffect = this.forwardEffect;
        super.effect = new KeyframeEffect(forwardEffect.target, forwardEffect.getKeyframes(), {...forwardEffect.getTiming(), composite: forwardEffect.composite});
        break;
      case "backward":
        const backwardEffect = this.backwardEffect;
        super.effect = new KeyframeEffect(backwardEffect.target, backwardEffect.getKeyframes(), {...backwardEffect.getTiming(), composite: backwardEffect.composite});
        break;
      default:
        throw new Error(`Invalid direction '${direction}' passed to setDirection(). Must be 'forward' or 'backward'`);
    }
  }
  
  async play(): Promise<void> {
    // If animation is already in progress and is just paused, resume the animation directly.
    // TODO: might need to rework this considering unpause()
    if (super.playState === 'paused') {
      super.play();
      return;
    }
    
    // If play() is called while already playing, return.
    if (this.inProgress) { return; }
    this.inProgress = true;
    
    if (this.isFinished) {
      this.isFinished = false;
      // If going forward, reset backward promises. If going backward, reset forward promises.
      this.resetPhases(this.direction === 'forward' ? 'backward' : 'forward');
    }

    super.play();
    // extra await allows additional pushes to queue before loop begins
    await Promise.resolve();

    const effect = super.effect!;
    const segments = this.direction === 'forward' ? this.segmentsForward : this.segmentsBackward;
    let roadblocked: boolean | null = null;
    // Traverse live array instead of static length since entries could be added mid-loop
    // TODO: May need to find a less breakable solution than the length thing.
    for (const segment of segments) {
      const [ endDelay, callbacks, roadblocks, integrityblocks, skipEndDelayUpdation, header ]: Segment = segment;
      header.activated = true;

      if (!skipEndDelayUpdation) {
        // Set animation to stop at a certain time using endDelay.
        effect.updateTiming({ endDelay });
        // if playback was paused from, resume playback
        if (roadblocked === true) {
          this.unpauseFromRoadblocks();
          roadblocked = false;
        }
        if (this.isExpediting) { super.finish(); }
        await super.finished;
      }
      else {
        // This allows outside operations like generateTimePromise() to push more callbacks to the queue...
        // before the next loop iteration (this makes up for not having await super.finished)
        await Promise.resolve();
      }
      header.completed = true;

      // Await any blockers for the completion of this phase
      if (roadblocks.length > 0) {
        this.pauseForRoadblocks();
        roadblocked = true;
        await Promise.all(roadblocks);
      }
      if (integrityblocks.length > 0) { await Promise.all(integrityblocks); }
      // Call all callbacks that awaited the completions of this phase
      for (const callback of callbacks) { callback(); }

      // extra await allows additional pushes to preempt next segment when they should
      await Promise.resolve();
    }
    
    this.inProgress = false;
    this.isFinished = true;
    this.isExpediting = false;
  }

  finish(): void {
    if (this.isExpediting) { return; }

    this.isExpediting = true;
    // Calling finish() on an unplayed animation should play and finish the animation
    if (!this.inProgress) { this.play(); }
    // If animation is already in progress, expedite its current segment.
    // From there, it will continue expediting using isExpediting
    else { super.finish(); }
  }

  private resetPhases(direction: 'forward' | 'backward' | 'both'): void {
    const resetForwardPhases = () => {
      const { delay, duration, endDelay } = this.forwardEffect.getTiming() as {[prop: string]: number};
      const segmentsForward: Segment[] = [
        [ -duration, [() => this.onDelayFinish()], [], [], delay === 0, {} ],
        [ 0, [() => this.onActiveFinish()], [], [], false, {} ],
        [ endDelay, [() => this.onEndDelayFinish()], [], [], endDelay === 0, {} ],
      ];
      this.segmentsForward = segmentsForward;
      this.segmentsForwardCache = [...segmentsForward] as SegmentsCache;
    };

    // NEXT REMINDER: Reimplement so that delayPhase for backwards direction corresponds to endDelayPhase
    // TODO: Determine if the NEXT REMINDER above has been correctly fulfilled
    const resetBackwardPhases = () => {
      const { delay, duration, endDelay } = this.backwardEffect.getTiming() as {[prop: string]: number};
      const segmentsBackward: Segment[] = [
        [ -duration, [() => this.onDelayFinish()], [], [], delay === 0, {} ],
        [ 0, [() => this.onActiveFinish()], [], [], false, {} ],
        [ endDelay, [() => this.onEndDelayFinish()], [], [], endDelay === 0, {} ],
      ];
      this.segmentsBackward = segmentsBackward;
      this.segmentsBackwardCache = [...segmentsBackward] as SegmentsCache;
    };

    switch(direction) {
      case "forward":
        resetForwardPhases();
        break;
      case "backward":
        resetBackwardPhases();
        break;
      case "both":
        resetForwardPhases();
        resetBackwardPhases();
        break;
      default: throw new Error(`Invalid direction '${direction}' used in resetPromises(). Must be 'forward', 'backward', or 'both'`);
    }
  }

  // accepts a time to wait for (converted to an endDelay) and returns a Promise that is resolved at that time
  generateTimePromise(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
  ): Promise<void>;
  generateTimePromise( direction: 'forward' | 'backward', phase: 'whole', timePosition: number | `${number}%`, ): Promise<void>;
  generateTimePromise(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
  ): Promise<void> {
    return new Promise(resolve => {
      // if the animation is already finished in the given direction, resolve immediately
      if (this.isFinished && this.direction === direction) { resolve(); return; }

      const [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition] = AnimTimelineAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

      // TODO: Give information on specific location of this animation block
      // check for out of bounds time positions
      if (phaseTimePosition < 0) {
        if (typeof timePosition === 'number') { throw new Error(`Negative timePosition ${timePosition} for phase '${phase}' resulted in invalid time ${phaseTimePosition}. Must be in the range [0, ${phaseDuration}] for this '${phase}'.`);}
        else { throw new Error(`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
      }
      if (phaseTimePosition > phaseDuration) {
        if (typeof timePosition === 'number') { throw new Error(`Invalid timePosition value ${timePosition} for phase '${phase}'. Must be in the range [0, ${phaseDuration}] for this '${phase}'.`); }
        else { throw new Error(`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
      }

      const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
      const numSegments = segments.length;
      
      for (let i = initialArrIndex; i < numSegments; ++i) {
        const currSegment = segments[i];
        
        // if new endDelay is less than curr, new segment should be inserted to list
        if (endDelay < currSegment[0]) {
          // but if the proceeding segement has already been reached in the loop, then the awaited time has already passed
          if (currSegment[5].activated) { resolve(); return; }

          // insert new segment to list
          segments.splice(i, 0, [ endDelay, [resolve], [], [], phaseTimePosition === 0, {} ]);
          return;
        }

        // if new endDelay matches that of curr, the resolver should be called with others in the same segment
        if (endDelay === currSegment[0]) {
          // but if curr segment is already completed, the awaited time has already passed
          if (currSegment[5].completed) { resolve(); return; }

          // add resolver to current segment
          currSegment[1].push(resolve);
          return;
        }
      }

      // note: this error should never be reached
      throw new Error('Something very wrong occured for addAwaited() to not be completed.');
    });
  }

  // TODO: Hide from general use
  addIntegrityblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ...promises: Promise<unknown>[]
  ): void;
  addIntegrityblocks(direction: 'forward' | 'backward', phase: 'whole', timePosition: number | `${number}%`, ...promises: Promise<unknown>[]): void;
  addIntegrityblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ...promises: Promise<unknown>[]
  ): void {
    this.addAwaiteds(direction, phase, timePosition, 'integrityblock', ...promises);
  }

  addRoadblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ...promises: Promise<unknown>[]
  ): void;
  addRoadblocks(direction: 'forward' | 'backward', phase: 'whole', timePosition: number | `${number}%`, ...promises: Promise<unknown>[]): void;
  addRoadblocks(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ...promises: Promise<unknown>[]
  ): void {
    this.addAwaiteds(direction, phase, timePosition, 'roadblock', ...promises);
  }

  private addAwaiteds(
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    awaitedType: 'integrityblock' | 'roadblock',
    ...promises: Promise<unknown>[]
  ): void {
    // if the animation is already finished in the given direction, do nothing
    if (this.isFinished && this.direction === direction) {
      // TODO: Add more details
      console.warn(`New ${awaitedType}s added to time position ${timePosition} will not be considered because the time has already passed.`);
      return;
    }
    
    const [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition] = AnimTimelineAnimation.computePhaseEmplacement(this, direction, phase, timePosition);

    // TODO: Give information on specific location of this animation block
    // check for out of bounds time positions
    if (phaseTimePosition < 0) {
      if (typeof timePosition === 'number') { throw new Error(`Negative timePosition ${timePosition} for phase '${phase}' resulted in invalid time ${phaseTimePosition}. Must be in the range [0, ${phaseDuration}] for this '${phase}'.`);}
      else { throw new Error(`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
    }
    if (phaseTimePosition > phaseDuration) {
      if (typeof timePosition === 'number') { throw new Error(`Invalid timePosition value ${timePosition} for phase '${phase}'. Must be in the range [0, ${phaseDuration}] for this '${phase}'.`); }
      else { throw new Error(`Invalid timePosition value ${timePosition}. Percentages must be in the range [0%, 100%].`); }
    }

    const endDelay: number = phaseEndDelayOffset + phaseTimePosition;
    const numSegments = segments.length;
    
    for (let i = initialArrIndex; i < numSegments; ++i) {
      const currSegment = segments[i];
      
      // if new endDelay is less than curr, new segment should be inserted to list
      if (endDelay < currSegment[0]) {
        // but if the proceeding segement has already been reached in the loop, then the time at which the new promises
        // should be awaited as already passed
        if (currSegment[5].activated) {
          // TODO: Add block location
          console.warn(`New ${awaitedType}s added to time position ${timePosition} will not be considered because the time has already passed.`);
          return;
        }

        // insert new segment to list
        segments.splice(i, 0, [
          endDelay,
          [],
          (awaitedType === 'roadblock' ? [...promises] : []),
          (awaitedType === 'integrityblock' ? [...promises] : []),
          phaseTimePosition === 0,
          {}
        ]);
        return;
      }

      // if new endDelay matches that of curr, the promises should be awaited with others in the same segment
      if (endDelay === currSegment[0]) {
        // but if curr segment is already completed, the time to await the promises has already passed
        if (currSegment[5].completed) {
          console.warn(`New ${awaitedType}s added to time position ${timePosition} will not be considered because the time has already passed.`);
          return;
        }

        // add promises to current segment
        currSegment[awaitedType === 'roadblock' ? 2 : 3].push(...promises);
        return;
      }
    }

    // note: this error should never be reached
    throw new Error('Something very wrong occured for addAwaited() to not be completed.');
  }

  private static computePhaseEmplacement(
    anim: AnimTimelineAnimation,
    direction: 'forward' | 'backward',
    phase: 'delayPhase' | 'activePhase' | 'endDelayPhase' | 'whole',
    timePosition: number | 'beginning' | 'end' | `${number}%`,
    ): [segments: Segment[], initialArrIndex: number, phaseDuration: number, phaseEndDelayOffset: number, phaseTimePosition: number] {
    // compute initial index, phase duration, and endDelay offset based on phase and arguments
    const [segments, segmentsCache] = direction === 'forward'
      ? [anim.segmentsForward, anim.segmentsForwardCache]
      : [anim.segmentsBackward, anim.segmentsBackwardCache];
    const effect = anim.getEffect(direction);
    const { duration, delay } = effect.getTiming() as {duration: number, delay: number};
    let initialArrIndex: number; // skips to first entry of a given phase
    let phaseEndDelayOffset: number; // applies negative (or 0) endDelay to get beginning of phase
    let phaseDuration: number; // duration of phase specified in argument
    let quasiPhase: typeof phase = phase; // opposite of phase (for backward direction)
    switch(phase) {
      case "delayPhase": quasiPhase = 'endDelayPhase'; break;
      case "endDelayPhase": quasiPhase = 'delayPhase'; break;
    }

    switch(direction === 'forward' ? phase : quasiPhase) {
      case "delayPhase":
        initialArrIndex = 0;
        phaseDuration = delay;
        phaseEndDelayOffset = -(delay + duration);
        break;
      case "activePhase":
        initialArrIndex = segments.indexOf(segmentsCache[0]) + 1;
        phaseDuration = duration;
        phaseEndDelayOffset = -duration;
        break;
      case "endDelayPhase":
        initialArrIndex = segments.indexOf(segmentsCache[1]) + 1;
        phaseDuration = effect.getTiming().endDelay as number;
        phaseEndDelayOffset = 0;
        break;
      case "whole":
        initialArrIndex = 0;
        phaseDuration = delay + duration + (effect.getTiming().endDelay as number);
        phaseEndDelayOffset = -(delay + duration);
        break;
      default:
        throw new Error(`Invalid phase '${phase}'. Must be 'delayPhase', 'activePhase', or 'endDelayPhase'.`);
    }

    // COMPUTE TIME POSITION RELATIVE TO PHASE
    let initialPhaseTimePos: number;

    if (timePosition === 'beginning') { initialPhaseTimePos = 0; }
    else if (timePosition === 'end') {  initialPhaseTimePos = phaseDuration; }
    else if (typeof timePosition === 'number') { initialPhaseTimePos = timePosition; }
    else {
      // if timePosition is in percent format, convert to correct time value based on phase
      const match = timePosition.toString().match(/(-?\d+(\.\d*)?)%/);
      // note: this error should never occur
      if (!match) { throw new Error(`Percentage format match not found.`); }

      initialPhaseTimePos = phaseDuration * (Number(match[1]) / 100);
    }

    // wrap any negative time values to count backwards from end of phase
    const wrappedPhaseTimePos = initialPhaseTimePos < 0 ? phaseDuration + initialPhaseTimePos : initialPhaseTimePos;
    // time positions should refer to the same point in a phase, regardless of the current direction
    const phaseTimePosition: number = direction === 'forward' ? wrappedPhaseTimePos : phaseDuration - wrappedPhaseTimePos;

    return [segments, initialArrIndex, phaseDuration, phaseEndDelayOffset, phaseTimePosition];
  }
}

export abstract class AnimBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> implements AnimBlockConfig {
  static id: number = 0;
  private static get emptyBankEntry() { return {generateKeyframes() { return [[], []]; }} as KeyframesBankEntry; }

  protected category: string = '<unspecificed category>';
  protected abstract get defaultConfig(): Partial<AnimBlockConfig>;

  parentSequence?: AnimSequence;
  parentTimeline?: AnimTimeline;
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  protected animation: AnimTimelineAnimation = {} as AnimTimelineAnimation;
  bankEntry: TBankEntry;
  animArgs: GeneratorParams<TBankEntry> = {} as GeneratorParams<TBankEntry>;
  domElem: Element;
  get rafLoopsProgress(): number {
    const { progress, direction } = this.animation.effect!.getComputedTiming();
    // ?? 1 because during the active phase (the only time when raf runs), null progress means finished
    return direction === 'normal' ? (progress ?? 1) : 1 - (progress ?? 1);
  }
  
  startsNextBlock: boolean = false;
  startsWithPrevious: boolean = false;
  commitsStyles: boolean = true;
  commitStylesAttemptForcefully: boolean = false; // attempt to unhide, commit, then re-hide
  composite: CompositeOperation = 'replace';
  classesToAddOnFinish: string[] = [];
  classesToAddOnStart: string[] = [];
  classesToRemoveOnFinish: string[] = [];
  classesToRemoveOnStart: string[] = []; // TODO: Consider order of addition/removal
  pregeneratesKeyframes: boolean = false;
  keyframesGenerators?: {
    forward: () => Keyframe[];
    backward: () => Keyframe[];
  };
  keyframeRequesters?: {
    forward: () => void;
    backward: () => void;
  };
  computeTween(initialVal: number, finalVal: number): number {
    return initialVal + (finalVal - initialVal) * this.rafLoopsProgress;
  }

  duration: number = 500;
  delay: number = 0;
  endDelay: number = 0;
  easing: EasingString = 'linear';
  playbackRate: number = 1; // actually base playback rate
  get compoundedPlaybackRate(): number { return this.playbackRate * (this.parentSequence?.compoundedPlaybackRate ?? 1); }

  fullStartTime = NaN;
  get activeStartTime() { return (this.fullStartTime + this.delay) / this.playbackRate; }
  get activeFinishTime() { return( this.fullStartTime + this.delay + this.duration) / this.playbackRate; }
  get fullFinishTime() { return (this.fullStartTime + this.delay + this.duration + this.endDelay) / this.playbackRate; }

  // TODO: Remove temporary bankExclusion solution
  constructor(domElem: Element | null, public animName: string, bank: IKeyframesBank | {bankExclusion: true}) {
    if (!domElem) {
      throw new Error(`Element must not be null`); // TODO: Improve error message
    }
    
    if ('bankExclusion' in bank) { this.bankEntry = AnimBlock.emptyBankEntry as TBankEntry; }
    else if (!bank[animName]) { throw new Error(`Invalid ${this.category} animation name ${animName}`); }
    else { this.bankEntry = bank[animName] as TBankEntry; }

    this.domElem = domElem;
    this.id = AnimBlock.id++;
  }

  initialize(animArgs: GeneratorParams<TBankEntry>, userConfig: Partial<AnimBlockConfig> = {}): typeof this {
    this.animArgs = animArgs;
    const mergedConfig = this.mergeConfigs(userConfig, this.bankEntry.config ?? {});
    Object.assign(this, mergedConfig);
    // cannot be exactly 0 because that causes some Animation-related bugs that can't be easily worked around
    this.duration = Math.max(this.duration as number, 0.01);

    // TODO: Handle case where only one keyframe is provided

    // The fontFeatureSettings part handles a very strange Firefox bug that causes animations to run without any visual changes
    // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using
    // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the
    // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to
    // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to
    // the default value to make it as unlikely as possible that anything the user does is obstructed.
    let [forwardFrames, backwardFrames]: [Keyframe[], Keyframe[] | undefined] = [[{fontFeatureSettings: 'normal'}], []];

    if (this.bankEntry.generateKeyframes) {
      if (this.pregeneratesKeyframes) {
        [forwardFrames, backwardFrames] = this.bankEntry.generateKeyframes.call(this, ...animArgs);
      }
    }
    else if (this.bankEntry.generateGenerators) {
      const [forwardGenerator, backwardGenerator] = this.bankEntry.generateGenerators.call(this, ...animArgs);
      if (this.pregeneratesKeyframes) {
        [forwardFrames, backwardFrames] = [forwardGenerator(), backwardGenerator()];
      }
      this.keyframesGenerators = {
        forward: forwardGenerator,
        backward: backwardGenerator,
      };
    }
    else {
      if (this.pregeneratesKeyframes) {
        const [forwardRequester, backwardRequester] = this.bankEntry.generateRafLoops.call(this, ...animArgs);
        this.keyframeRequesters = {
          forward: forwardRequester,
          backward: backwardRequester,
        };
      }
    }

    // playbackRate is not included because it is computed at the time of animating
    const keyframeOptions: KeyframeEffectOptions = {
      delay: this.delay,
      duration: this.duration,
      endDelay: this.endDelay,
      fill: 'forwards',
      easing: getEasing(this.easing),
      composite: this.composite,
    };

    this.animation = new AnimTimelineAnimation(
      new KeyframeEffect(
        this.domElem,
        forwardFrames,
        keyframeOptions,
      ),
      new KeyframeEffect(
        this.domElem,
        backwardFrames ?? [...forwardFrames],
        {
          ...keyframeOptions,
          // if no backward frames were specified, assume the reverse of the forward frames
          ...(backwardFrames ? {} : {direction: 'reverse'}),
          // if backward frames were specified, easing needs to be inverted
          ...(backwardFrames ? {easing: getEasing(this.easing, {inverted: true})} : {}),
          // delay & endDelay are of course swapped when we want to play in "reverse"
          delay: keyframeOptions.endDelay,
          endDelay: keyframeOptions.delay,
        },
      )
    );

    this.animation.pauseForRoadblocks = () => {
      if (this.parentSequence) { this.parentSequence.pause(); }
      else { this.pause(); }
    }
    this.animation.unpauseFromRoadblocks = () => {
      if (this.parentSequence) { this.parentSequence.unpause(); }
      else { this.unpause(); }
    }

    return this;
  }

  setID(idSeq: number, idTimeline: number): void {
    [this.sequenceID, this.timelineID] = [idSeq, idTimeline];
    [this.animation.sequenceID, this.animation.timelineID] = [idSeq, idTimeline];
  }

  // TODO: prevent calls to play/rewind while already animating
  play(): Promise<void> { return this.animate('forward'); }
  rewind(): Promise<void> { return this.animate('backward'); }
  get pause() { return this.animation.pause.bind(this.animation); }
  get unpause() { return this.animation.play.bind(this.animation); }
  get finish() { return this.animation.finish.bind(this.animation); }
  get generateTimePromise() { return this.animation.generateTimePromise.bind(this.animation); }
  get addIntegrityblocks() { return this.animation.addIntegrityblocks.bind(this.animation); } // TODO: Hide from general use
  get addRoadblocks() { return this.animation.addRoadblocks.bind(this.animation); }
  // multiplies playback rate of parent timeline and sequence (if exist) with base playback rate
  useCompoundedPlaybackRate() { this.animation.updatePlaybackRate(this.compoundedPlaybackRate); }

  // TODO: Figure out good way to implement XNOR
  protected _onStartForward(): void {};
  protected _onFinishForward(): void {};
  protected _onStartBackward(): void {};
  protected _onFinishBackward(): void {};

  protected async animate(direction: 'forward' | 'backward'): Promise<void> {
    const animation = this.animation;
    animation.setDirection(direction);
    // If keyframes are generated here, clear the current frames to prevent interference with
    // generators
    if (!this.pregeneratesKeyframes && direction === 'forward') {
      animation.setForwardAndBackwardFrames([{fontFeatureSettings: 'normal'}], []);
    }
    this.useCompoundedPlaybackRate();

    // used as resolve() and reject() in the eventually returned promise
    let resolver: (value: void | PromiseLike<void>) => void;
    let rejecter: (reason?: any) => void;
    
    const skipping = this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo;
    if (skipping) { animation.finish(); }
    else { animation.play(); }
    if (this.parentSequence?.isPaused) { animation.pause(); }
    
    // After delay phase, then apply class modifications and call onStart functions.
    // Additionally, generate keyframes on 'forward' if keyframe pregeneration is disabled.
    animation.onDelayFinish = () => {
      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.classesToAddOnStart);
          this.domElem.classList.remove(...this.classesToRemoveOnStart);
          this._onStartForward();
  
          // Keyframe generation is done here so that generations operations that rely on the side effects of class modifications and _onStartForward()
          // can function properly.
          // TODO: Handle case where only one keyframe is provided
          if (!this.pregeneratesKeyframes) {
            if (this.bankEntry.generateKeyframes) {
              let [forwardFrames, backwardFrames] = this.bankEntry.generateKeyframes.call(this, ...this.animArgs); // TODO: extract generateKeyframes
              this.animation.setForwardAndBackwardFrames(forwardFrames, backwardFrames ?? [...forwardFrames], backwardFrames ? false : true);
            }
            else if (this.bankEntry.generateGenerators) {
              this.animation.setForwardFrames(this.keyframesGenerators!.forward());
            }
            else if (this.bankEntry.generateRafLoops) {
              const newLoops = this.bankEntry.generateRafLoops.call(this, ...this.animArgs);
              this.keyframeRequesters = {forward: newLoops[0], backward: newLoops[1]};
            }
          }

          if (this.bankEntry.generateRafLoops) { requestAnimationFrame(this.loop); }

          // sets it back to 'forwards' in case it was set to 'none' in a previous running
          animation.effect?.updateTiming({fill: 'forwards'});
          break;
  
        case 'backward':
          this._onStartBackward();
          this.domElem.classList.add(...this.classesToRemoveOnFinish);
          this.domElem.classList.remove(...this.classesToAddOnFinish);

          if (!this.pregeneratesKeyframes) {
            if (this.bankEntry.generateKeyframes) {
              // do nothing (backward keyframes would have already been set during forward direction)
            }
            else if (this.bankEntry.generateGenerators) {
              this.animation.setBackwardFrames(this.keyframesGenerators!.backward());
            }
          }

          if (this.bankEntry.generateRafLoops) { requestAnimationFrame(this.loop); }
          break;
  
        default:
          throw new Error(`Invalid direction '${direction}' passed to animate(). Must be 'forward' or 'backward'`);
      }
    };

    // After active phase, then handle commit settings, apply class modifications, and call onFinish functions.
    animation.onActiveFinish = () => {
      // CHANGE NOTE: Move hidden class stuff here
      if (this.commitsStyles || this.commitStylesAttemptForcefully) {
        // Attempt to apply the styles to the element.
        try {
          animation.commitStyles();
          // ensures that accumulating effects are not stacked after commitStyles() (hopefully, new spec will prevent the need for this workaround)
          animation.effect?.updateTiming({ fill: 'none' });
        }
        // If commitStyles() fails, it's because the element is not rendered.
        catch (_) {
          // If forced commit is disabled, do not re-attempt to commit the styles; throw error instead.
          if (!this.commitStylesAttemptForcefully) {
            // TODO: Add specifics about where exactly failure occured
            rejecter(new CommitStylesError(`Cannot commit animation styles while element is not rendered.\nTo attempt to temporarily override the hidden state, set the 'commitStylesAttemptForcefully' config setting to true. If the element's ancestor is hidden, this will still fail.`));
          }

          // If forced commit is enabled, attempt to override the hidden state and apply the style.
          try {
            this.domElem.classList.add('wbfk-override-hidden'); // CHANGE NOTE: Use new hidden classes
            animation.commitStyles();
            animation.effect?.updateTiming({ fill: 'none' });
            this.domElem.classList.remove('wbfk-override-hidden');
          }
          // If this fails, then the element's parent is hidden. Do not attempt to remedy; throw error instead.
          catch (err) {
            rejecter(new CommitStylesError(`Failed to override element's hidden state with 'commitStylesAttemptForcefully to commit styles. Cannot commit styles if element is hidden by an ancestor.`));
          }
        }
      }

      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.classesToAddOnFinish);
          this.domElem.classList.remove(...this.classesToRemoveOnFinish);
          this._onFinishForward();
          break;
        case 'backward':
          this._onFinishBackward();
          this.domElem.classList.add(...this.classesToRemoveOnStart);
          this.domElem.classList.remove(...this.classesToAddOnStart);
          break;
      }
    };
    
    // After endDelay phase, then cancel animation, remove this block from the timeline, and resolve overall promise.
    animation.onEndDelayFinish = () => {
      animation.cancel();
      resolver();
    };

    return new Promise<void>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
  }

  private loop = () => {
    switch(this.animation.direction) {
      case "forward":
        this.keyframeRequesters?.forward();
        break;
      case "backward":
        this.keyframeRequesters?.backward();
        break;
      default: throw new Error(`Something very wrong occured for there to be an error here.`);
    }

    if (this.rafLoopsProgress === 1) { return; }
    requestAnimationFrame(this.loop);
  }

  private mergeConfigs(userConfig: Partial<AnimBlockConfig>, bankEntryConfig: Partial<AnimBlockConfig>): Partial<AnimBlockConfig> {
    return {
      // subclass defaults take priority
      ...this.defaultConfig,

      // config defined in animation bank take priority
      ...bankEntryConfig,

      // custom config take priority
      ...userConfig,

      // mergeable properties
      classesToAddOnStart: mergeArrays(
        this.defaultConfig.classesToAddOnStart ?? [],
        bankEntryConfig.classesToAddOnStart ?? [],
        userConfig.classesToAddOnStart ?? [],
      ),

      classesToRemoveOnStart: mergeArrays(
        this.defaultConfig.classesToRemoveOnStart ?? [],
        bankEntryConfig.classesToRemoveOnStart ?? [],
        userConfig.classesToRemoveOnStart ?? [],
      ),

      classesToAddOnFinish: mergeArrays(
        this.defaultConfig.classesToAddOnFinish ?? [],
        bankEntryConfig.classesToAddOnFinish ?? [],
        userConfig.classesToAddOnFinish ?? [],
      ),

      classesToRemoveOnFinish: mergeArrays(
        this.defaultConfig.classesToRemoveOnFinish ?? [],
        bankEntryConfig.classesToRemoveOnFinish ?? [],
        userConfig.classesToRemoveOnFinish ?? [],
      ),
    };
  }
}

export class EntranceBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected category = 'entrance';
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      pregeneratesKeyframes: true,
    };
  }

  // constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
  //   if (!bankEntry) { throw new Error(`Invalid entrance animation name ${animName}`); }
  //   super(domElem, animName, bankEntry);
  // }

  protected _onStartForward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }

  protected _onFinishBackward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }
}

export class ExitBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected category = 'exit';
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      pregeneratesKeyframes: true,
    };
  }

  // constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
  //   if (!bankEntry) { throw new Error(`Invalid exit animation name ${animName}`); }
  //   super(domElem, animName, bankEntry);
  // }

  protected _onFinishForward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }
}

export class EmphasisBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected category = 'emphasis';
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }

  // constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
  //   if (!bankEntry) { throw new Error(`Invalid emphasis animation name ${animName}`); }
  //   super(domElem, animName, bankEntry);
  // }
}

export class TranslationBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected category = 'translation';
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      composite: 'accumulate',
    };
  }

  // constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
  //   if (!bankEntry) { throw new Error(`Invalid translation animation name ${animName}`); }
  //   super(domElem, animName, bankEntry);
  // }
}

export class ScrollBlock extends AnimBlock {
  scrollableElem: Element;
  protected category = 'scroll';
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
    };
  }

  constructor(scrollableElem: Element | null, animName: string, bank: IKeyframesBank) {
    super(scrollableElem, animName, bank);
    if (!scrollableElem) { throw new Error(`Something very wrong must have occured for this error to be thrown`) }
    this.scrollableElem = scrollableElem;
  }
}
