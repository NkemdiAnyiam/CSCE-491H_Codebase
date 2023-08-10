import { AnimSequence } from "./AnimSequence.js";
import { AnimTimeline } from "./AnimTimeline.js";
import { KeyframesBankEntry } from "./TestUsability/WebFlik.js";

// TODO: Potentially create multiple extendable interfaces to separate different types of customization
type CustomKeyframeEffectOptions = {
  blocksNext: boolean;
  blocksPrev: boolean;
  commitsStyles: boolean;
  composite: 'replace' | 'add' | 'accumulate';
  classesToAddOnFinish: string[];
  classesToAddOnStart: string[];
  classesToRemoveOnFinish: string[];
  classesToRemoveOnStart: string[]; // TODO: Consider order of addition/removal
  pregeneratesKeyframes: boolean;
}

// TODO: fix issue of duration and other should-be numeric values being allowed in string form
export type AnimBlockConfig = Required<Pick<KeyframeEffectOptions, | 'duration' | 'easing' | 'playbackRate' | 'delay' | 'endDelay'>> & CustomKeyframeEffectOptions;
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




type AwaitedTime = [
  endDelay: number,
  resolvers: ((value: void | PromiseLike<void>) => void)[],
  awaiteds: Promise<any>[],
  // true when awaiting delay/endDelay periods but the awaited delay/endDelay duration is 0
  skipPlay?: boolean,
  message?: string,
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

  get timelineID(): number { return this._timelineID; }
  set timelineID(id: number) { this._timelineID = id; }
  get sequenceID(): number { return this._sequenceID; }
  set sequenceID(id: number) { this._sequenceID = id; }

  constructor(private forwardEffect: KeyframeEffect, private backwardEffect: KeyframeEffect) {
    super();

    if (this.forwardEffect.target !== backwardEffect.target) { throw new Error(`Forward and backward keyframe effects must target the same element`); }
    // TODO: check for undefined as well
    if (this.forwardEffect.target == null) { throw new Error(`Animation target must be non-null`); }
    
    super.effect = forwardEffect;
    this.resetPromises('both');
  }

  private resetPromises(direction: 'forward' | 'backward' | 'both'): void {
    const resetForwardPromises = () => {
      this.forwardFinishes = {
        delayPhase: new Promise<void>(resolve => {this.resolveForward_delayPhase = resolve}),
        activePhase: new Promise<void>(resolve => {this.resolveForward_activePhase = resolve}),
        endDelayPhase: new Promise<void>(resolve => {this.resolveForward_endDelayPhase = resolve}),
      };

      const { delay, duration, endDelay } = this.forwardEffect.getTiming();
      this.awaitedForwardTimes = [
        [ -(duration as number), [() => this.onDelayFinish(), this.resolveForward_delayPhase], [], (delay as number) === 0, 'Finished delay period F ' + delay, ],
        [ 0, [() => this.onActiveFinish(), this.resolveForward_activePhase], [], false, 'Finished active period F ' + duration ],
        [ endDelay as number, [() => this.onEndDelayFinish(), this.resolveForward_endDelayPhase], [], (endDelay as number) === 0, 'Finished endDelay period F' ],
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
        [ -(duration as number), [() => this.onDelayFinish(), this.resolveBackward_delayPhase], [], (delay as number) === 0, 'Finished delay period B ' + delay, ],
        [ 0, [() => this.onActiveFinish(), this.resolveBackward_activePhase], [], false, 'Finished active period B ' + duration ],
        [ endDelay as number, [() => this.onEndDelayFinish(), this.resolveBackward_endDelayPhase], [], (endDelay as number) === 0, 'Finished endDelay period B' ],
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
  
  // TODO: May have to await loading keyframes if not pregenerated
  async play(): Promise<void> {
    // if animation is already in progress and is just paused, resume the animation directly
    if (super.playState === 'paused') {
      super.play();
      return;
    }
    
    // if play() is called while already playing, return
    if (this.inProgress) { return; }
    this.inProgress = true;
    
    const effect = super.effect!;

    switch(this.direction) {
      case "forward":
        this.resetPromises('backward');
        const awaitedForwardTimes = this.awaitedForwardTimes;

        super.play();
        await Promise.resolve();
        // use length directly because entries could be added after loop is already entered
        // TODO: May need to find a less breakable solution than the length thing
        for (let i = 0; i < awaitedForwardTimes.length; ++i) {
          const [ endDelay, resolvers, awaiteds, bypassPlay, message ] = awaitedForwardTimes[i];

          if (!bypassPlay) {
            this.phaseIsFinishable = true;
            // set animation to stop at a certain time using endDelay
            effect.updateTiming({ endDelay });
            await super.finished;
          }
          else {
            // this allows outside operations like blockUntil() to push more resolvers to the queue...
            // before the next loop iteration
            this.phaseIsFinishable = false;
            await Promise.resolve();
          }

          // await any blockers for the completion of this phase
          if (awaiteds.length > 0) { await Promise.all(awaiteds); }
          // fulfill all promises that depend on the completion of this phase
          for (const resolver of resolvers) { resolver(); }
          // if (message) { console.log(message); }
        }
        break;

      case "backward":
        this.resetPromises('forward');
        const awaitedBackwardTimes = this.awaitedBackwardTimes;
        super.play();

        await Promise.resolve();
        for (let i = 0; i < awaitedBackwardTimes.length; ++i) {
          const [ endDelay, resolvers, awaiteds, bypassPlay, message ] = awaitedBackwardTimes[i];

          if (!bypassPlay) {
            this.phaseIsFinishable = true;
            effect.updateTiming({ endDelay });
            await super.finished;
          }
          else {
            this.phaseIsFinishable = false;
            await Promise.resolve();
          }

          if (awaiteds.length > 0) { await Promise.all(awaiteds); }
          for (const resolver of resolvers) { resolver(); }
          // if (message) { console.log(message); }
        }
        break;

      default: throw new Error(`Invalid direction '${this.direction}' encountered in play(). Must be either 'forward' or 'backward'`);
    }
    

    this.inProgress = false;
  }

  async finish(): Promise<void> {
    // all the side-effects of custom play() need to be in motion before calling super.finish()
    if (!this.inProgress) { this.play(); }

    // we must await super.finished each time because of segmentation
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

  onDelayFinish: Function = () => {};
  onActiveFinish: Function = () => {};
  onEndDelayFinish: Function = () => {};

  blockUntil(direction: 'forward' | 'backward', localTime: number): Promise<void> {
    // TODO: check for out-of-bounds times
    // TODO: may need to check if the animation is in the 'finished' state or is in progress already...
    // past localTime. In such cases, the returned promise should be immediately resolved
    const { duration, delay } = super.effect!.getTiming();
    if (localTime < 0) { throw new Error(`Invalid blockUntil() value ${localTime}; value must be >= 0`); }
    // to await animation reaching currentTime in its running, we must use...
    // the equivalent endDelay, which is localTime - (duration + delay)
    const endDelay = localTime - ((duration as number) + (delay as number));

    return new Promise(resolve => {
      const awaitedTimes = direction === 'forward' ? this.awaitedForwardTimes : this.awaitedBackwardTimes;
      const awaitedTimesLength = awaitedTimes.length;
      for (let i = 0; i < awaitedTimesLength; ++i) {
        const currAwaitedTime = awaitedTimes[i];
        if (endDelay < currAwaitedTime[0]) {
          awaitedTimes.splice(i, 0, [endDelay, [resolve], []]);
          break;
        }
        else if (endDelay === currAwaitedTime[0]) { 
          currAwaitedTime[1].push(resolve);
          break;
        }
      }
    });
  }

  awaitActiveForefinisher(direction: 'forward' | 'backward', ...promises: Promise<any>[]): void {
    // TODO: may need to check if the animation is in the 'finished' state
    const awaitedTimes = direction === 'forward' ? this.awaitedForwardTimes : this.awaitedBackwardTimes;
    const awaitedTimesLength = awaitedTimes.length;
    for (let i = 1; i < awaitedTimesLength; ++i) {
      const currAwaitedTime = awaitedTimes[i];
      if (currAwaitedTime[0] === 0.01) { 
        currAwaitedTime[2].push(...promises);
        break;
      }
    }
  }

  awaitEndDelayForefinisher(direction: 'forward' | 'backward', ...promises: Promise<any>[]): void {
    // TODO: may need to check if the animation is in the 'finished' state
    const awaitedTimes = direction === 'forward' ? this.awaitedForwardTimes : this.awaitedBackwardTimes;
    const currAwaitedTime = awaitedTimes[awaitedTimes.length - 1];
    currAwaitedTime[2].push(...promises);
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
        // TODO: Might be able to just do super.effect = this.forwardEffect without encountering Firefox bug. Test later
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

export abstract class AnimBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> {
  static id: number = 0;

  parentSequence?: AnimSequence; // TODO: replace with own dynamic list of running animations
  parentTimeline?: AnimTimeline;
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  config: AnimBlockConfig = {} as AnimBlockConfig;
  animation: AnimTimelineAnimation = {} as AnimTimelineAnimation;
  animArgs: Parameters<TBankEntry['generateKeyframes']> = {} as Parameters<TBankEntry['generateKeyframes']>;
  domElem: Element;

  fullStartTime = NaN;
  get activeStartTime() { return this.fullStartTime + +this.config.delay; }
  get activeFinishTime() { return this.activeStartTime + +this.config.duration; }
  get fullFinishTime() { return this.activeFinishTime + +this.config.endDelay; }

  protected abstract get defaultConfig(): Partial<AnimBlockConfig>;

  constructor(domElem: Element | null, public animName: string, public bankEntry: TBankEntry) {
    if (!domElem) {
      throw new Error(`Element must not be null`); // TODO: Improve error message
    }

    this.domElem = domElem;
    this.id = AnimBlock.id++;
  }

  get blocksNext() { return this.config.blocksNext; }
  get blocksPrev() { return this.config.blocksPrev; }
  get delay() { return this.config.delay; }
  get endDelay() { return this.config.endDelay; }
  get duration() { return this.config.duration; }

  initialize(animArgs: Parameters<TBankEntry['generateKeyframes']>, userConfig: Partial<AnimBlockConfig> = {}): typeof this {
    this.animArgs = animArgs;
    const config = this.mergeConfigs(userConfig, this.bankEntry.config ?? {});
    config.duration = Math.max(config.duration as number, 0.01);
    this.config = config;

    // TODO: Handle case where only one keyframe is provided
    // The fontFeatureSettings part handles a very strange Firefox bug that causes animations to run without any visual changes...
    // when the animation is finished, setKeyframes() is called, and the animation continues after extending the runtime using...
    // endDelay. It appears that the bug only occurs when the keyframes field contains nothing that will actually affect the...
    // styling of the element (for example, adding {['fake-field']: 'bla'} will not fix it), but I obviously do not want to...
    // add anything that will actually affect the style of the element, so I decided to use fontFeatureSettings and set it to...
    // the default value to make it as unlikely as possible that anything the user does is obstructed.
    let [forwardFrames, backwardFrames] = config.pregeneratesKeyframes ?
      this.bankEntry.generateKeyframes.call(this, ...animArgs) : // TODO: extract generateKeyframes
      [[{fontFeatureSettings: 'normal'}], []]; // TODO: maybe use 'default' instead

    const keyframeOptions: KeyframeEffectOptions = {
      delay: config.delay,
      duration: config.duration,
      endDelay: config.endDelay,
      fill: config.commitsStyles ? 'forwards' : 'none',
      easing: config.easing,
      composite: config.composite,
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
          direction: backwardFrames ? 'normal' : 'reverse',
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

  stepForward(): Promise<void> {
    return this.animate('forward');
  }

  stepBackward(): Promise<void> {
    return this.animate('backward');
  }

  // TODO: Figure out good way to implement XNOR
  protected _onStartForward(): void {};
  protected _onFinishForward(): void {};
  protected _onStartBackward(): void {};
  protected _onFinishBackward(): void {};

  protected async animate(direction: 'forward' | 'backward'): Promise<void> {
    const animation = this.animation;
    animation.setDirection(direction);
    animation.loadKeyframeEffect(direction);
    animation.updatePlaybackRate((this.parentTimeline?.playbackRate ?? 1) * this.config.playbackRate);
    const skipping = this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo;
    skipping ? animation.finish() : animation.play();
    this.parentTimeline?.currentAnimations.set(this.id, this.animation);
    
    animation.onDelayFinish = () => {
      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.config.classesToAddOnStart);
          this.domElem.classList.remove(...this.config.classesToRemoveOnStart);
          this._onStartForward();
  
          // Keyframe generation is done here so that generations operations that rely on the side effects of class modifications and _onStartForward()...
          // can function properly.
          if (!this.config.pregeneratesKeyframes) {
            // TODO: Handle case where only one keyframe is provided
            let [forwardFrames, backwardFrames] = this.bankEntry.generateKeyframes.call(this, ...this.animArgs); // TODO: extract generateKeyframes
            this.animation.setForwardAndBackwardFrames(forwardFrames, backwardFrames ?? [...forwardFrames], backwardFrames ? false : true);
          }
  
          break;
  
        case 'backward':
          this._onStartBackward();
          this.domElem.classList.add(...this.config.classesToRemoveOnFinish);
          this.domElem.classList.remove(...this.config.classesToAddOnFinish);
          break;
  
        default:
          throw new Error(`Invalid direction '${direction}' passed to animate(). Must be 'forward' or 'backward'`);
      }
    };
    
    // // if in skip mode, finish the animation instantly. Otherwise, play through it normally
    // this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo ? animation.finish() : animation.play(); // TODO: Move playback rate definition to subclasses?

    animation.onActiveFinish = () => {
      // console.log('A', this.domElem);
      // CHANGE NOTE: Move hidden class stuff here
      // TODO: Account for case where parent is hidden
      if (this.config.commitsStyles) {
        try {
          animation.commitStyles(); // actually applies the styles to the element
        }
        catch (err) {
          console.warn(err); // TODO: Make more specific
          this.domElem.classList.add('wbfk-override-hidden'); // CHANGE NOTE: Use new hidden classes
          animation.commitStyles();
          this.domElem.classList.remove('wbfk-override-hidden');
        }
      }
      
      switch(direction) {
        case 'forward':
          this.domElem.classList.add(...this.config.classesToAddOnFinish);
          this.domElem.classList.remove(...this.config.classesToRemoveOnFinish);
          this._onFinishForward();
          break;
        case 'backward':
          this._onFinishBackward();
          this.domElem.classList.add(...this.config.classesToRemoveOnStart);
          this.domElem.classList.remove(...this.config.classesToAddOnStart);
          break;
      }
    };

    let resolver: (value: void | PromiseLike<void>) => void = () => {};
    
    animation.onEndDelayFinish = () => {
      // console.log('E', this.domElem);
      animation.cancel();
      this.parentTimeline?.currentAnimations.delete(this.id);
      resolver();
    };

    return new Promise<void>(resolve => resolver = resolve);
  }

  private mergeConfigs(userConfig: Partial<AnimBlockConfig>, bankEntryConfig: Partial<AnimBlockConfig>): AnimBlockConfig {
    return {
      // pure defaults
      blocksNext: true,
      blocksPrev: true,
      duration: 500,
      playbackRate: 1, // TODO: Potentially rename to "basePlaybackRate"
      commitsStyles: true,
      composite: 'replace',
      easing: 'linear',
      pregeneratesKeyframes: false,
      delay: 0,
      endDelay: 0,

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
