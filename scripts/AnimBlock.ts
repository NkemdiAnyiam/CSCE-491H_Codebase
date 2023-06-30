import { AnimSequence } from "./AnimSequence.js";
import { AnimationNameIn, IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik.js";

// TODO: Potentially create multiple extendable interfaces to separate different types of customization
type CustomKeyframeEffectOptions = {
  blocksNext: boolean;
  blocksPrev: boolean;
  commitStyles: boolean;
  composite: 'replace' | 'add' | 'accumulate';
  classesToAddOnFinish: string[];
  classesToAddOnStart: string[];
  classesToRemoveOnFinish: string[];
  classesToRemoveOnStart: string[]; // TODO: Consider order of addition/removal
  pregenerateKeyframes: boolean;
}

export type AnimBlockConfig = Required<Pick<KeyframeEffectOptions, | 'duration' | 'easing' | 'playbackRate'>> & CustomKeyframeEffectOptions;
// TODO: validate duration and playbackRate?

type TOffset = {
  offsetX: number; // determines offset to apply to the respective positional property
  offsetY: number; // determines offset to apply to the respective positional property
  offsetXY?: number; // overrides offsetX and offsetY
  offsetUnitsX: CssLengthUnit;
  offsetUnitsY: CssLengthUnit;
  offsetUnitsXY?: CssLengthUnit; // overrides offsetUnitsX and offsetUnitsY
}

// TODO: individual X/Y should override XY, not the other way around
// TODO: Potentially allow strings in the format of <number><CssLengthUnit>
export interface TNoElem extends TOffset {
  translateX: number;
  translateY: number;
  translateXY?: number; // overrides translateX and translateY
  unitsX: CssLengthUnit;
  unitsY: CssLengthUnit;
  unitsXY?: CssLengthUnit; // overrides unitsX and unitsY
}

export interface TElem extends TOffset {
  // targetElem: Element; // if specified, translations will be with respect to this target element
  alignmentY: CssYAlignment; // determines vertical alignment with target element
  alignmentX: CssXAlignment; // determines horizontal alignment with target element
  offsetTargetX: number; // offset based on target's width (0.5 pushes us 50% of the target element's width rightward)
  offsetTargetY: number; // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  offsetTargetXY?: number; // overrides offsetTargetX and offsetTargetY
  preserveX: boolean; // if true, no horizontal translation with respect to the target element (offsets still apply)
  preserveY: boolean; // if true, no vertical translation with respect to the target element (offsets still apply)
}

type CssLengthUnit = | 'px' | 'rem' | '%';
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

export abstract class AnimBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> {
  static id: number = 0;

  parentSequence?: AnimSequence; // TODO: replace with own dynamic list of running animations
  parentTimeline?: any; // TODO: specify annotation
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  config: AnimBlockConfig = {} as AnimBlockConfig;
  animation: AnimTimelineAnimation = {} as AnimTimelineAnimation;
  animArgs: Parameters<TBehavior['generateKeyframes']> = {} as Parameters<TBehavior['generateKeyframes']>;
  domElem: Element;

  protected abstract get defaultConfig(): Partial<AnimBlockConfig>;

  constructor(domElem: Element | null, public animName: string, public behaviorGroup: TBehavior) {
    if (!domElem) {
      throw new Error(`Element must not be null`); // TODO: Improve error message
    }

    this.domElem = domElem;
    this.id = AnimBlock.id++;
  }

   initialize(animArgs: Parameters<TBehavior['generateKeyframes']>, userConfig: Partial<AnimBlockConfig> = {}) {
    this.animArgs = animArgs;
    this.config = this.mergeConfigs(userConfig, this.behaviorGroup.config ?? {});

    // TODO: Handle case where only one keyframe is provided
    let [forwardFrames, backwardFrames] = this.config.pregenerateKeyframes ?
      this.behaviorGroup.generateKeyframes.call(this, ...animArgs) : // TODO: extract generateKeyframes
      [[], []];

    const keyframeOptions: KeyframeEffectOptions = {
      duration: this.config.duration,
      fill: this.config.commitStyles ? 'forwards' : 'none',
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
      if (!this.config.pregenerateKeyframes) {
        // TODO: Handle case where only one keyframe is provided
        let [forwardFrames, backwardFrames] = this.behaviorGroup.generateKeyframes.call(this, ...this.animArgs); // TODO: extract generateKeyframes
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
      if (this.config.commitStyles) {
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

  private mergeConfigs(userConfig: Partial<AnimBlockConfig>, behaviorGroupConfig: Partial<AnimBlockConfig>): AnimBlockConfig {
    return {
      // pure defaults
      blocksNext: true,
      blocksPrev: true,
      duration: 500,
      playbackRate: 1, // TODO: Potentially rename to "basePlaybackRate"
      commitStyles: true,
      composite: 'replace',
      easing: 'linear',
      pregenerateKeyframes: false,

      // subclass defaults take priority
      ...this.defaultConfig,

      // config defined in animation bank take priority
      ...behaviorGroupConfig,

      // custom config take priority
      ...userConfig,

      // mergeable properties
      classesToAddOnStart: mergeArrays(
        this.defaultConfig.classesToAddOnStart ?? [],
        behaviorGroupConfig.classesToAddOnStart ?? [],
        userConfig.classesToAddOnStart ?? [],
      ),

      classesToRemoveOnStart: mergeArrays(
        this.defaultConfig.classesToRemoveOnStart ?? [],
        behaviorGroupConfig.classesToRemoveOnStart ?? [],
        userConfig.classesToRemoveOnStart ?? [],
      ),

      classesToAddOnFinish: mergeArrays(
        this.defaultConfig.classesToAddOnFinish ?? [],
        behaviorGroupConfig.classesToAddOnFinish ?? [],
        userConfig.classesToAddOnFinish ?? [],
      ),

      classesToRemoveOnFinish: mergeArrays(
        this.defaultConfig.classesToRemoveOnFinish ?? [],
        behaviorGroupConfig.classesToRemoveOnFinish ?? [],
        userConfig.classesToRemoveOnFinish ?? [],
      ),
    };
  }
}

export class EntranceBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  // TODO: remove
  AAADummyEntranceProp = 'Ent';
  ZZZDummyEntranceProp = 'rance';

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    // TODO: Consider commitStyles for false by default
    return {
      commitStyles: false,
      pregenerateKeyframes: true,
    };
  }

  constructor(domElem: Element | null, animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid entrance animation name ${animName}`); }
    super(domElem, animName, behaviorGroup);
  }

  protected _onStartForward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }

  protected _onFinishBackward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }
}

export class ExitBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  // TODO: remove
  AAADummyExitProp = 'Ex';
  ZZZDummyExitProp = 'it';

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitStyles: false,
      pregenerateKeyframes: true,
    };
  }

  constructor(domElem: Element | null, animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid exit animation name ${animName}`); }
    super(domElem, animName, behaviorGroup);
  }

  protected _onFinishForward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }
}

export class EmphasisBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  // TODO: remove
  AAADummyEmphasisProp = 'Emph';
  ZZZDummyEmphasisProp = 'asis';

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }

  constructor(domElem: Element | null, animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid emphasis animation name ${animName}`); }
    super(domElem, animName, behaviorGroup);
  }
}

export class TranslationBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  // TODO: remove
  AAADummyEmphasisProp = 'Trans';
  ZZZDummyEmphasisProp = 'lation';

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      composite: 'accumulate',
    };
  }

  constructor(domElem: Element | null, animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid translation animation name ${animName}`); }
    super(domElem, animName, behaviorGroup);
  }
}

// TODO: Create util
function mergeArrays<T>(...arrays: Array<T>[]): Array<T> {
  return Array.from(new Set(new Array<T>().concat(...arrays)));
}
