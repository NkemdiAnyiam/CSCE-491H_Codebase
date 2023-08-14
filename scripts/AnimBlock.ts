import { AnimSequence } from "./AnimSequence.js";
import { AnimTimeline } from "./AnimTimeline.js";
import { KeyframesBankEntry } from "./TestUsability/WebFlik.js";

// TODO: Potentially create multiple extendable interfaces to separate different types of customization
type CustomKeyframeEffectOptions = {
  startsNextBlock: boolean;
  startsWithPreviousBlock: boolean;
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
  easing: string;
  playbackRate: number;
  delay: number;
  endDelay: number;
}

export type AnimBlockConfig = KeyframeTimingOptions & CustomKeyframeEffectOptions;
// TODO: validate duration and playbackRate?

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




type AwaitedTime = [
  endDelay: number,
  resolvers: ((value: void | PromiseLike<void>) => void)[],
  awaiteds: Promise<any>[],
  // true when awaiting delay/endDelay periods but the awaited delay/endDelay duration is 0
  skipPlay?: boolean,
];

type FinishPromises = {
  delayPhase: Promise<void>;
  activePhase: Promise<void>;
  endDelayPhase: Promise<void>;
}

export class AnimTimelineAnimation extends Animation {
  private _timelineID: number = NaN;
  private _sequenceID: number = NaN;
  direction: 'forward' | 'backward' = 'forward';
  private inProgress = false;
  // holds list of stopping points and resolvers to control segmentation of animation...
  // to help with Promises-based sequencing
  private awaitedForwardTimes: AwaitedTime[] = [];
  private awaitedBackwardTimes: AwaitedTime[] = [];
  private resolveForward_delayPhase: (value: void | PromiseLike<void>) => void = () => { throw new Error('resolveForward_delayPhase() was called before assigning resolve'); };
  private resolveForward_activePhase: (value: void | PromiseLike<void>) => void = () => { throw new Error('resolveForward_activePhase() was called before assigning resolve'); };
  private resolveForward_endDelayPhase: (value: void | PromiseLike<void>) => void = () => { throw new Error('resolveForward_endDelayPhase() was called before assigning resolve'); };
  // TODO: Prevent outside modifications
  forwardFinishes: FinishPromises = {} as FinishPromises;
  private resolveBackward_delayPhase: (value: void | PromiseLike<void>) => void = () => { throw new Error('resolveBackward_delayPhase() was called before assigning resolve'); };
  private resolveBackward_activePhase: (value: void | PromiseLike<void>) => void = () => { throw new Error('resolveBackward_activePhase() was called before assigning resolve'); };
  private resolveBackward_endDelayPhase: (value: void | PromiseLike<void>) => void = () => { throw new Error('resolveBackward_endDelayPhase() was called before assigning resolve'); };
  backwardFinishes: FinishPromises = {} as FinishPromises;
  phaseIsFinishable = false;
  
  onDelayFinish: Function = () => {};
  onActiveFinish: Function = () => {};
  onEndDelayFinish: Function = () => {};
  private get trueEndDelay(): number { return (this.direction === 'forward' ? this.forwardEffect : this.backwardEffect).getTiming().endDelay as number; }

  get timelineID(): number { return this._timelineID; }
  set timelineID(id: number) { this._timelineID = id; }
  get sequenceID(): number { return this._sequenceID; }
  set sequenceID(id: number) { this._sequenceID = id; }

  constructor(private forwardEffect: KeyframeEffect, private backwardEffect: KeyframeEffect) {
    super();

    if (this.forwardEffect.target !== backwardEffect.target) { throw new Error(`Forward and backward keyframe effects must target the same element`); }
    // TODO: check for undefined as well
    if (this.forwardEffect.target == null) { throw new Error(`Animation target must be non-null`); }
    
    this.loadKeyframeEffect('forward');
    this.resetPromises('both');
  }

  private resetPromises(direction: 'forward' | 'backward' | 'both'): void {
    const resetForwardPromises = () => {
      this.forwardFinishes = {
        delayPhase: new Promise<void>(resolve => {this.resolveForward_delayPhase = resolve}),
        activePhase: new Promise<void>(resolve => {this.resolveForward_activePhase = resolve}),
        endDelayPhase: new Promise<void>(resolve => {this.resolveForward_endDelayPhase = resolve}),
      };

      const { delay, duration, endDelay } = this.forwardEffect.getTiming() as {[prop: string]: number};
      this.awaitedForwardTimes = [
        [ -duration, [() => this.onDelayFinish(), this.resolveForward_delayPhase], [], delay === 0 ],
        [ 0, [() => this.onActiveFinish(), this.resolveForward_activePhase], [], false ],
        [ endDelay as number, [() => this.onEndDelayFinish(), this.resolveForward_endDelayPhase], [] ],
      ];
    };

    const resetBackwardPromises = () => {
      this.backwardFinishes = {
        delayPhase: new Promise<void>(resolve => {this.resolveBackward_delayPhase = resolve}),
        activePhase: new Promise<void>(resolve => {this.resolveBackward_activePhase = resolve}),
        endDelayPhase: new Promise<void>(resolve => {this.resolveBackward_endDelayPhase = resolve}),
      };
  
      const { delay, duration, endDelay } = this.backwardEffect.getTiming();
      this.awaitedBackwardTimes = [
        [ -(duration as number), [() => this.onDelayFinish(), this.resolveBackward_delayPhase], [], (delay as number) === 0 ],
        [ 0, [() => this.onActiveFinish(), this.resolveBackward_activePhase], [], false ],
        [ endDelay as number, [() => this.onEndDelayFinish(), this.resolveBackward_endDelayPhase], [], (endDelay as number) === 0 ],
      ];
    };

    switch(direction) {
      case "forward":
        resetForwardPromises();
        break;
      case "backward":
        resetBackwardPromises();
        break;
      case "both":
        resetForwardPromises();
        resetBackwardPromises();
        break;
      default: throw new Error(`Invalid direction '${direction}' used in resetPromises(). Must be 'forward', 'backward', or 'both'`);
    }
  }
  
  async play(): Promise<void> {
    // If animation is already in progress and is just paused, resume the animation directly.
    if (super.playState === 'paused') {
      super.play();
      return;
    }
    
    // If play() is called while already playing, return.
    if (this.inProgress) { return; }
    this.inProgress = true;
    
    const effect = super.effect!;
    // If going forward, reset backward promises. If going backward, reset forward promises.
    this.resetPromises(this.direction === 'forward' ? 'backward' : 'forward');
    const awaitedTimes = this.direction === 'forward' ? this.awaitedForwardTimes : this.awaitedBackwardTimes;
    super.play();

    await Promise.resolve();
    // Use length directly because entries could be added after loop is already entered.
    // TODO: May need to find a less breakable solution than the length thing.
    for (let i = 0; i < awaitedTimes.length; ++i) {
      const [ endDelay, resolvers, awaiteds, bypassPlay ] = awaitedTimes[i];

      if (!bypassPlay) {
        this.phaseIsFinishable = true;
        // Set animation to stop at a certain time using endDelay.
        effect.updateTiming({ endDelay });
        await super.finished;
      }
      else {
        // This allows outside operations like blockUntil() to push more resolvers to the queue...
        // before the next loop iteration.
        this.phaseIsFinishable = false;
        await Promise.resolve();
      }

      // Await any blockers for the completion of this phase
      if (awaiteds.length > 0) { await Promise.all(awaiteds); }
      // Fulfill all promises that depend on the completion of this phase
      for (const resolver of resolvers) { resolver(); }
    }
    
    this.inProgress = false;
  }

  async finish(): Promise<void> {
    // All the side-effects of custom play() need to be in motion before calling super.finish().
    if (!this.inProgress) { this.play(); }

    // We must await super.finished each time to account for segmentation.
    while (this.inProgress) {
      if (this.phaseIsFinishable) {
        super.finish();
        await super.finished;
      }
      else {
        await Promise.resolve();
      }
    }
  }

  // accepts a time to wait for (converted to an endDelay) and returns a Promise that is resolved at that time
  generateTimePromise(direction: 'forward' | 'backward', localTime: number): Promise<void> {
    // TODO: check for out-of-bounds times
    // TODO: may need to check if the animation is in the 'finished' state or is in progress already...
    // past localTime. In such cases, the returned promise should be immediately resolved
    const { duration, delay } = super.effect!.getTiming();
    if (localTime < 0) { throw new Error(`Invalid blockUntil() value ${localTime}; value must be >= 0`); }
    // to await animation reaching currentTime in its running, we must use...
    // the equivalent endDelay, which is localTime - (duration + delay)
    const endDelay = localTime - ((duration as number) + (delay as number));
    // if (endDelay > this.trueEndDelay) { throw new Error(`Invalid blockUntil() time ${localTime}; value exceeded this animation's endDelay ${this.trueEndDelay}.`); }

    return new Promise(resolve => {
      const awaitedTimes = direction === 'forward' ? this.awaitedForwardTimes : this.awaitedBackwardTimes;
      const awaitedTimesLength = awaitedTimes.length;
      for (let i = 0; i < awaitedTimesLength; ++i) {
        const currAwaitedTime = awaitedTimes[i];
        if (endDelay <= currAwaitedTime[0]) {
          // if new endDelay is less than curr, insert new awaitedTime group to list
          if (endDelay < currAwaitedTime[0])
            { awaitedTimes.splice(i, 0, [endDelay, [resolve], []]); }
          // otherwise, this resolver should be called along with others functions in the same awaited time group
          else
            { currAwaitedTime[1].push(resolve); }
          break;
        }
      }
    });
  }

  addRoadblocks(direction: 'forward' | 'backward', atLocalTime: number, ...promises: Promise<any>[]): void;
  addRoadblocks(direction: 'forward' | 'backward', atPhasePoint: 'atActiveFinish' | 'atEndDelayFinish', ...promises: Promise<any>[]): void;
  addRoadblocks(direction: 'forward' | 'backward', point: number | ('atActiveFinish' | 'atEndDelayFinish'), ...promises: Promise<any>[]): void {
    const awaitedTimes = direction === 'forward' ? this.awaitedForwardTimes : this.awaitedBackwardTimes;
    const awaitedTimesLength = awaitedTimes.length;
    // TODO: may need to check if animation is in 'finished' state

    if (typeof point === 'string') {
      switch(point) {
        // starts at idx 1 because 0 is reserved for delay finish
        case "atActiveFinish":
          awaitedTimes.slice(1)
            .find((awaitedTime) => awaitedTime[0] === 0)?.[2]
            .push(...promises);
          break;
        case "atEndDelayFinish":
          awaitedTimes[awaitedTimesLength - 1][2].push(...promises);
          break;
        default:
          throw new Error(`Invalid addRoadblocks() direction '${direction}'; must be 'atActiveFinish' or 'atEndDelayFinish'.`);
      }
    }
    else {
      // TODO: implement numeric
    }
  }
  
  setForwardFrames(frames: Keyframe[]): void {
    this.forwardEffect.setKeyframes(frames);
  }

  setBackwardFrames(frames: Keyframe[], backwardIsMirror?: boolean): void {
    this.backwardEffect.setKeyframes(frames);
    this.backwardEffect.updateTiming({direction: backwardIsMirror ? 'reverse' : 'normal'});
  }

  setForwardAndBackwardFrames(forwardFrames: Keyframe[], backwardFrames: Keyframe[], backwardIsMirror?: boolean): void {
    this.setForwardFrames(forwardFrames);
    (super.effect as KeyframeEffect).setKeyframes(forwardFrames);
    this.setBackwardFrames(backwardFrames, backwardIsMirror);
  }

  loadKeyframeEffect(direction: 'forward' | 'backward'): void {
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

  setDirection(direction: 'forward' | 'backward') { this.direction = direction; }
}

export abstract class AnimBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> implements AnimBlockConfig {
  static id: number = 0;

  protected abstract get defaultConfig(): Partial<AnimBlockConfig>;

  parentSequence?: AnimSequence; // TODO: replace with own dynamic list of running animations
  parentTimeline?: AnimTimeline;
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  animation: AnimTimelineAnimation = {} as AnimTimelineAnimation;
  animArgs: Parameters<TBankEntry['generateKeyframes']> = {} as Parameters<TBankEntry['generateKeyframes']>;
  domElem: Element;
  
  startsNextBlock: boolean = false;
  startsWithPreviousBlock: boolean = false;
  commitsStyles: boolean = true;
  commitStylesAttemptForcefully: boolean = false; // attempt to unhide, commit, then re-hide
  composite: CompositeOperation = 'replace';
  classesToAddOnFinish: string[] = [];
  classesToAddOnStart: string[] = [];
  classesToRemoveOnFinish: string[] = [];
  classesToRemoveOnStart: string[] = []; // TODO: Consider order of addition/removal
  pregeneratesKeyframes: boolean = false;
  duration: number = 500;
  delay: number = 0;
  endDelay: number = 0;
  easing: string = 'linear';
  playbackRate: number = 1;

  fullStartTime = NaN;
  get activeStartTime() { return this.fullStartTime + this.delay; }
  get activeFinishTime() { return this.activeStartTime + this.duration; }
  get fullFinishTime() { return this.activeFinishTime + this.endDelay; }

  constructor(domElem: Element | null, public animName: string, public bankEntry: TBankEntry) {
    if (!domElem) {
      throw new Error(`Element must not be null`); // TODO: Improve error message
    }

    this.domElem = domElem;
    this.id = AnimBlock.id++;
  }

  initialize(animArgs: Parameters<TBankEntry['generateKeyframes']>, userConfig: Partial<AnimBlockConfig> = {}): typeof this {
    this.animArgs = animArgs;
    const mergedConfig = this.mergeConfigs(userConfig, this.bankEntry.config ?? {});
    Object.assign(this, mergedConfig);
    this.duration = Math.max(this.duration as number, 0.01);

    // TODO: Handle case where only one keyframe is provided
    // The fontFeatureSettings part handles a very strange Firefox bug that causes animations to run without any visual changes...
    // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using...
    // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the...
    // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to...
    // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to...
    // the default value to make it as unlikely as possible that anything the user does is obstructed.
    let [forwardFrames, backwardFrames] = this.pregeneratesKeyframes ?
      this.bankEntry.generateKeyframes.call(this, ...animArgs) : // TODO: extract generateKeyframes
      [[{fontFeatureSettings: 'normal'}], []]; // TODO: maybe use 'default' instead

    const keyframeOptions: KeyframeEffectOptions = {
      delay: this.delay,
      duration: this.duration,
      endDelay: this.endDelay,
      fill: this.commitsStyles ? 'forwards' : 'none',
      easing: this.easing,
      composite: this.composite,
    };

    // TODO: Add playbackRate
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
          direction: backwardFrames ? 'normal' : 'reverse',
          // delay & endDelay are of course swapped when we want to play in "reverse"
          delay: keyframeOptions.endDelay,
          endDelay: keyframeOptions.delay,
        },
      )
    );

    return this;
  }

  setID(idSeq: number, idTimeline: number): void {
    [this.sequenceID, this.timelineID] = [idSeq, idTimeline];
    [this.animation.sequenceID, this.animation.timelineID] = [idSeq, idTimeline];
  }

  stepForward(): Promise<void> { return this.animate('forward'); }
  stepBackward(): Promise<void> { return this.animate('backward'); }

  // TODO: Figure out good way to implement XNOR
  protected _onStartForward(): void {};
  protected _onFinishForward(): void {};
  protected _onStartBackward(): void {};
  protected _onFinishBackward(): void {};

  protected async animate(direction: 'forward' | 'backward'): Promise<void> {
    const animation = this.animation;
    animation.setDirection(direction);
    animation.loadKeyframeEffect(direction);
    animation.updatePlaybackRate((this.parentTimeline?.playbackRate ?? 1) * this.playbackRate);
    const skipping = this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo;
    let resolver: (value: void | PromiseLike<void>) => void;
    let rejecter: (reason?: any) => void;
    skipping ? animation.finish() : animation.play();
    this.parentTimeline?.currentAnimations.set(this.id, this.animation);
    
    // After delay phase, then apply class modifications and call onStart functions.
    // Additionally, generate keyframes on 'forward' if keyframe pregeneration is disabled.
    animation.onDelayFinish = () => {
      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.classesToAddOnStart);
          this.domElem.classList.remove(...this.classesToRemoveOnStart);
          this._onStartForward();
  
          // Keyframe generation is done here so that generations operations that rely on the side effects of class modifications and _onStartForward()...
          // can function properly.
          if (!this.pregeneratesKeyframes) {
            // TODO: Handle case where only one keyframe is provided
            let [forwardFrames, backwardFrames] = this.bankEntry.generateKeyframes.call(this, ...this.animArgs); // TODO: extract generateKeyframes
            this.animation.setForwardAndBackwardFrames(forwardFrames, backwardFrames ?? [...forwardFrames], backwardFrames ? false : true);
          }
  
          break;
  
        case 'backward':
          this._onStartBackward();
          this.domElem.classList.add(...this.classesToRemoveOnFinish);
          this.domElem.classList.remove(...this.classesToAddOnFinish);
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
      this.parentTimeline?.currentAnimations.delete(this.id);
      resolver();
    };

    return new Promise<void>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
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
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      pregeneratesKeyframes: true,
    };
  }

  constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
    if (!bankEntry) { throw new Error(`Invalid entrance animation name ${animName}`); }
    super(domElem, animName, bankEntry);
  }

  protected _onStartForward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }

  protected _onFinishBackward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }
}

export class ExitBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      pregeneratesKeyframes: true,
    };
  }

  constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
    if (!bankEntry) { throw new Error(`Invalid exit animation name ${animName}`); }
    super(domElem, animName, bankEntry);
  }

  protected _onFinishForward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }
}

export class EmphasisBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }

  constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
    if (!bankEntry) { throw new Error(`Invalid emphasis animation name ${animName}`); }
    super(domElem, animName, bankEntry);
  }
}

export class TranslationBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      composite: 'accumulate',
    };
  }

  constructor(domElem: Element | null, animName: string, bankEntry: TBankEntry) {
    if (!bankEntry) { throw new Error(`Invalid translation animation name ${animName}`); }
    super(domElem, animName, bankEntry);
  }
}

// TODO: Create util
function mergeArrays<T>(...arrays: Array<T>[]): Array<T> {
  return Array.from(new Set(new Array<T>().concat(...arrays)));
}
