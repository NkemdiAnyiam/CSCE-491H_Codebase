import { AnimSequence } from "./AnimSequence.js";
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

export type AnimBlockConfig = Required<Pick<KeyframeEffectOptions, | 'duration' | 'easing' | 'playbackRate'>> & CustomKeyframeEffectOptions;
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

export class AnimTimelineAnimation extends Animation {
  // TODO: improve syntax
  get forward() {
    this.effect = new KeyframeEffect(this.forwardEffect.target, this.forwardEffect.getKeyframes(), {...this.forwardEffect.getTiming(), composite: this.forwardEffect.composite});
    return this;
  }
  get backward() {
    this.effect = new KeyframeEffect(this.backwardEffect.target, this.backwardEffect.getKeyframes(), {...this.backwardEffect.getTiming(), composite: this.backwardEffect.composite});
    return this;
  }
  setForwardFrames(frames: Keyframe[]) {
    this.forwardEffect.setKeyframes(frames);
  }
  setBackwardFrames(frames: Keyframe[], backwardIsMirror?: boolean) {
    this.backwardEffect.setKeyframes(frames);
    this.backwardEffect.updateTiming({direction: backwardIsMirror ? 'reverse' : 'normal'});
  }
  setForwardAndBackwardFrames(forwardFrames: Keyframe[], backwardFrames: Keyframe[], backwardIsMirror?: boolean) {
    this.forwardEffect.setKeyframes(forwardFrames);
    this.backwardEffect.setKeyframes(backwardFrames);
    this.backwardEffect.updateTiming({direction: backwardIsMirror ? 'reverse' : 'normal'});
  }
  constructor(private forwardEffect: KeyframeEffect, private backwardEffect: KeyframeEffect) {
    super();
    if (forwardEffect.target !== backwardEffect.target) { throw new Error(`Forward and backward keyframe effects must target the same element`); }
    if (forwardEffect.target == null) { throw new Error(`Animation target must be non-null`); }
  }
  private _timelineID: number = NaN;
  private _sequenceID: number = NaN;

  get timelineID(): number { return this._timelineID; }
  set timelineID(id: number) { this._timelineID = id; }
  get sequenceID(): number { return this._sequenceID; }
  set sequenceID(id: number) { this._sequenceID = id; }
}

export abstract class AnimBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> {
  static id: number = 0;

  parentSequence?: AnimSequence; // TODO: replace with own dynamic list of running animations
  parentTimeline?: any; // TODO: specify annotation
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  config: AnimBlockConfig = {} as AnimBlockConfig;
  animation: AnimTimelineAnimation = {} as AnimTimelineAnimation;
  animArgs: Parameters<TBankEntry['generateKeyframes']> = {} as Parameters<TBankEntry['generateKeyframes']>;
  domElem: Element;

  protected abstract get defaultConfig(): Partial<AnimBlockConfig>;

  constructor(domElem: Element | null, public animName: string, public bankEntry: TBankEntry) {
    if (!domElem) {
      throw new Error(`Element must not be null`); // TODO: Improve error message
    }

    this.domElem = domElem;
    this.id = AnimBlock.id++;
  }

   initialize(animArgs: Parameters<TBankEntry['generateKeyframes']>, userConfig: Partial<AnimBlockConfig> = {}) {
    this.animArgs = animArgs;
    this.config = this.mergeConfigs(userConfig, this.bankEntry.config ?? {});

    // TODO: Handle case where only one keyframe is provided
    let [forwardFrames, backwardFrames] = this.config.pregeneratesKeyframes ?
      this.bankEntry.generateKeyframes.call(this, ...animArgs) : // TODO: extract generateKeyframes
      [[], []];

    const keyframeOptions: KeyframeEffectOptions = {
      duration: this.config.duration,
      fill: this.config.commitsStyles ? 'forwards' : 'none',
      easing: this.config.easing,
      composite: this.config.composite,
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
        {...keyframeOptions, direction: backwardFrames ? 'normal' : 'reverse'},
      )
    );

    return this;
  }

  getBlocksNext() { return this.config.blocksNext; }
  getBlocksPrev() { return this.config.blocksPrev; }

  setID(idSeq: number, idTimeline: number) {
    [this.sequenceID, this.timelineID] = [idSeq, idTimeline];
    [this.animation.sequenceID, this.animation.timelineID] = [idSeq, idTimeline];
  }

  stepForward(): Promise<void> {
    return new Promise(resolve => {
      if (!this.config.pregeneratesKeyframes) {
        // TODO: Handle case where only one keyframe is provided
        let [forwardFrames, backwardFrames] = this.bankEntry.generateKeyframes.call(this, ...this.animArgs); // TODO: extract generateKeyframes
        this.animation.setForwardAndBackwardFrames(forwardFrames, backwardFrames ?? [...forwardFrames], backwardFrames ? false : true);
      }
      
      this.animate(this.animation.forward, 'forward')
        .then(() => resolve());
    });
  }

  stepBackward(): Promise<void> {
    return new Promise(resolve => {
      this.animate(this.animation.backward, 'backward')
        .then(() => resolve());
    });
  }

  // TODO: Figure out good way to implement XNOR
  protected _onStartForward(): void {};
  protected _onFinishForward(): void {};
  protected _onStartBackward(): void {};
  protected _onFinishBackward(): void {};

  protected animate(animation: Animation, direction: 'forward' | 'backward'): Promise<void> {
    switch(direction) {
      case 'forward':
        this.domElem.classList.add(...this.config.classesToAddOnStart);
        this.domElem.classList.remove(...this.config.classesToRemoveOnStart);
        this._onStartForward();
        break;
      case 'backward':
        this._onStartBackward();
        this.domElem.classList.add(...this.config.classesToRemoveOnFinish);
        this.domElem.classList.remove(...this.config.classesToAddOnFinish);
        break;
    }

    // set playback rate
    animation.updatePlaybackRate((this.parentTimeline?.playbackRate ?? 1) * this.config.playbackRate);
    
    // if in skip mode, finish the animation instantly. Otherwise, play through it normally
    this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo ? animation.finish() : animation.play(); // TODO: Move playback rate definition to subclasses?

    // return Promise that fulfills when the animation is completed
    return animation.finished.then(() => {
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
      
      // prevents animations from jumping backward in their execution when duration or playback rate is modified
      animation.cancel();
      // // prevents clipping out nested absolutely-positioned elements outside the bounding box
      // if (isEntering) { this.domElem.style.removeProperty('clip-path'); }
    });
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
