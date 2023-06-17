import { AnimSequence } from "./AnimSequence.js";
import { AnimationNameIn, IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik.js";

type CustomKeyframeEffectOptions = {
  blocksNext: boolean;
  blocksPrev: boolean;
  commitStyles: boolean;
  addedClassesOnStartForward: string[];
  removedClassesOnStartForward: string[]; // TODO: Consider order of addition/removal
}

export type AnimBlockOptions = Required<Pick<KeyframeEffectOptions, | 'duration' | 'easing' | 'playbackRate'>> & CustomKeyframeEffectOptions;
// TODO: validate duration and playbackRate?

type TOffset = {
  offsetX: number; // determines offset to apply to the respective positional property
  offsetY: number; // determines offset to apply to the respective positional property
  offsetXY?: number; // overrides offsetX and offsetY
  offsetUnitsX: CssLengthUnit;
  offsetUnitsY: CssLengthUnit;
  offsetUnitsXY?: CssLengthUnit; // overrides offsetUnitsX and offsetUnitsY
}

interface TNoElem extends TOffset {
  translateX: number;
  translateY: number;
  translateXY?: number; // overrides translateX and translateY
  unitsX: CssLengthUnit;
  unitsY: CssLengthUnit;
  unitsXY?: CssLengthUnit; // overrides unitsX and unitsY
}

interface TElem extends TOffset {
  // targetElem: HTMLElement; // if specified, translations will be with respect to this target element
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
  get forward(): AnimTimelineAnimation {
    this.effect = this.forwardEffect;
    return this;
  }
  get backward(): AnimTimelineAnimation {
    this.effect = this.backwardEffect;
    return this;
  }
  setForwardFrames(frames: Keyframe[]) {
    this.forwardEffect.setKeyframes(frames);
  }
  setBackwardFrames(frames: Keyframe[]) {
    this.backwardEffect.setKeyframes(frames);
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
  options: AnimBlockOptions = {} as AnimBlockOptions;
  animation: AnimTimelineAnimation = {} as AnimTimelineAnimation;

  protected abstract get defaultOptions(): Partial<AnimBlockOptions>;

  // constructor(/*public domElem: Element, public animName: string, userOptions: Partial<AnimBlockOptions> = {}, behaviorGroupOptions: Partial<AnimBlockOptions> = {}*/) {
    constructor(public domElem: Element, public animName: string, public behaviorGroup: TBehavior) {
    if (!domElem) {
      throw new Error(`Element must not be undefined`); // TODO: Improve error message
    }

    this.id = AnimBlock.id++;
  }

   initialize(params: Parameters<TBehavior['generateKeyframes']>, userOptions: Partial<AnimBlockOptions> = {}) {
    this.options = this.mergeOptions(userOptions, this.behaviorGroup.options ?? {});

    // TODO: Handle case where only one keyframe is provided
    let [forwardFrames, backwardFrames] = this.behaviorGroup.generateKeyframes.call(this, ...params); // TODO: extract generateKeyframes

    const keyframeOptions: KeyframeEffectOptions = {
      duration: this.options.duration,
      fill: this.options.commitStyles ? 'forwards' : 'none',
      easing: this.options.easing,
      // TODO: handle composite
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

  getBlocksNext() { return this.options.blocksNext; }
  getBlocksPrev() { return this.options.blocksPrev; }

  setID(idSeq: number, idTimeline: number) {
    [this.sequenceID, this.timelineID] = [idSeq, idTimeline];
    [this.animation.sequenceID, this.animation.timelineID] = [idSeq, idTimeline];
  }

  stepForward(): Promise<void> {
    return new Promise(resolve => {
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

  protected _addClassesOnStartForward(...classes: string[]): void {
    this.domElem.classList.add(...classes);
  }

  protected animate(animation: Animation, direction: 'forward' | 'backward'): Promise<void> {
    switch(direction) {
      case 'forward':
        this.domElem.classList.add(...this.options.addedClassesOnStartForward);
        this.domElem.classList.remove(...this.options.removedClassesOnStartForward);
        this._onStartForward();
        break;
      case 'backward':
        this._onStartBackward();
        break;
    }

    // set playback rate
    animation.updatePlaybackRate((this.parentTimeline?.playbackRate ?? 1) * this.options.playbackRate);
    
    // if in skip mode, finish the animation instantly. Otherwise, play through it normally
    this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo ? animation.finish() : animation.play(); // TODO: Move playback rate definition to subclasses?

    // return Promise that fulfills when the animation is completed
    return animation.finished.then(() => {
      // CHANGE NOTE: Move hidden class stuff here
      // TODO: Account for case where parent is hidden
      if (this.options.commitStyles) {
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
          this._onFinishForward();
          break;
        case 'backward':
          this._onFinishBackward();
          this.domElem.classList.add(...this.options.removedClassesOnStartForward);
          this.domElem.classList.remove(...this.options.addedClassesOnStartForward);
          break;
      }
      
      // prevents animations from jumping backward in their execution when duration or playback rate is modified
      animation.cancel();
      // // prevents clipping out nested absolutely-positioned elements outside the bounding box
      // if (isEntering) { this.domElem.style.removeProperty('clip-path'); }
    });
  }

  private mergeOptions(userOptions: Partial<AnimBlockOptions>, behaviorGroupOptions: Partial<AnimBlockOptions>): AnimBlockOptions {
    return {
      // pure defaults
      blocksNext: true,
      blocksPrev: true,
      duration: 500,
      playbackRate: 1, // TODO: Potentially rename to "basePlaybackRate"
      commitStyles: true,
      easing: 'linear',

      // subclass defaults take priority
      ...this.defaultOptions,

      // options defined in animation bank take priority
      ...behaviorGroupOptions,

      // custom options take priority
      ...userOptions,

      // mergeable properties
      addedClassesOnStartForward: mergeArrays(
        this.defaultOptions.addedClassesOnStartForward ?? [],
        behaviorGroupOptions.addedClassesOnStartForward ?? [],
        userOptions.addedClassesOnStartForward ?? [],
      ),

      removedClassesOnStartForward: mergeArrays(
        this.defaultOptions.removedClassesOnStartForward ?? [],
        behaviorGroupOptions.removedClassesOnStartForward ?? [],
        userOptions.removedClassesOnStartForward ?? [],
      ),
    };
  }
}

// CHANGE NOTE: Generic class accepting an extension of AnimationBank
export class EntranceBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  // TODO: remove
  AAADummyProp = 'hello';
  ZZZDummyProp = 'world';

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    // TODO: Consider commitStyles for false by default
    return {
      commitStyles: false,
    };
  }

  constructor(domElem: Element, animName: string, behaviorGroup: TBehavior) {
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

export class ExitBlock<TBank extends IKeyframesBank> extends AnimBlock {
  animation: AnimTimelineAnimation;
  private static Bank: IKeyframesBank = {};
  static setBank<T extends IKeyframesBank>(bank: T) { ExitBlock.Bank = {...bank}; }

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {
      commitStyles: false,
    };
  }
  
  constructor(domElem: Element, animName: AnimationNameIn<TBank>, userOptions: Partial<AnimBlockOptions> = {}) {
    const animationBank = ExitBlock.Bank as TBank;
    const behaviorGroup = animationBank[animName];
    if (!behaviorGroup) { throw new Error(`Invalid exit animation name "${animName}"`); }

    super(domElem, animName, userOptions, behaviorGroup.options);

    // Create the Animation instance that we will use on our DOM element
    const forwardFrames: Keyframe[] = behaviorGroup.keyframes;

    // if an explicit definition for reversal frames exists, use them.
    // otherwise, use the reverse of the forward frames
    let backwardFrames: Keyframe[];
    const undoAnimationName = `undo--${animName}`;
    backwardFrames = (undoAnimationName in animationBank) ?
      animationBank[undoAnimationName as typeof animName].keyframes :
      [...forwardFrames];

    const keyframeOptions: KeyframeEffectOptions = {
      duration: this.options.duration,
      fill: this.options.commitStyles ? 'forwards' : 'none',
      easing: this.options.easing,
      // playbackRate: options.playbackRate, // TODO: implement and uncomment
    }
    
    this.animation = new AnimTimelineAnimation(
      new KeyframeEffect(
        domElem,
        forwardFrames,
        keyframeOptions
      ),
      new KeyframeEffect(
        domElem,
        backwardFrames,
        {...keyframeOptions, direction: 'reverse'}
      ),
    );
  }

  protected _onFinishForward(): void {
    this.domElem.classList.add('wbfk-hidden');
  }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbfk-hidden');
  }
}

export class EmphasisBlock<TBank extends IKeyframesBank> extends AnimBlock {
  animation: AnimTimelineAnimation;
  private static Bank: IKeyframesBank = {};
  static setBank<T extends IKeyframesBank>(bank: T) { EmphasisBlock.Bank = {...bank}; }

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {};
  }
  
  constructor(domElem: Element, animName: AnimationNameIn<TBank>, userOptions: Partial<AnimBlockOptions> = {}) {
    const animationBank = EmphasisBlock.Bank as TBank;
    const behaviorGroup = animationBank[animName];
    if (!behaviorGroup) { throw new Error(`Invalid emphasis animation name "${animName}"`); }

    super(domElem, animName, userOptions, behaviorGroup.options);

    // Create the Animation instance that we will use on our DOM element
    const forwardFrames: Keyframe[] = behaviorGroup.keyframes;

    // if an explicit definition for reversal frames exists, use them.
    // otherwise, use the reverse of the forward frames
    let backwardFrames: Keyframe[];
    const undoAnimationName = `undo--${animName}`;
    backwardFrames = (undoAnimationName in animationBank) ?
      animationBank[undoAnimationName as typeof animName].keyframes :
      [...forwardFrames];

    const keyframeOptions: KeyframeEffectOptions = {
      duration: this.options.duration,
      fill: this.options.commitStyles ? 'forwards' : 'none',
      easing: this.options.easing,
      // playbackRate: options.playbackRate, // TODO: implement and uncomment
    }
    
    this.animation = new AnimTimelineAnimation(
      new KeyframeEffect(
        domElem,
        forwardFrames,
        keyframeOptions
      ),
      new KeyframeEffect(
        domElem,
        backwardFrames,
        {...keyframeOptions, direction: 'reverse'}
      ),
    );
  }
}

export class TranslateBlock extends AnimBlock {
  translationOptions: TNoElem;
  animation: AnimTimelineAnimation;

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {};
  }

  constructor(domElem: Element, userOptions: Partial<AnimBlockOptions> = {}, translationOptions: Partial<TNoElem> = {}) {
    super(domElem, 'translate', userOptions);

    this.translationOptions = {
      ...this.applyTranslateOptions(translationOptions),
      ...translationOptions,
    };

    const [forwardFrames, backwardFrames] = this.createTranslationKeyframes();

    this.animation = new AnimTimelineAnimation(
      new KeyframeEffect(
        domElem,
        forwardFrames,
        {
          duration: this.options.duration,
          fill: 'forwards', // TODO: Make customizable?
          easing: this.options.easing,
          composite: 'accumulate',
          // playbackRate: options.playbackRate, // TODO: implement and uncomment
        }
      ),
      new KeyframeEffect(
        domElem,
        backwardFrames,
        {
          duration: this.options.duration,
          fill: 'forwards', // TODO: Make customizable?
          easing: this.options.easing,
          composite: 'accumulate',
          // playbackRate: options.playbackRate, // TODO: implement and uncomment
        }
      )
    );
  }

  protected applyTranslateOptions(translateOptions: Partial<TNoElem>): TNoElem {
    return {
      translateX: 0,
      translateY: 0,
      unitsX: 'px',
      unitsY: 'px',
      offsetX: 0,
      offsetY: 0,
      offsetUnitsX: 'px',
      offsetUnitsY: 'px',

      ...translateOptions,
    };
  }

  private createTranslationKeyframes(): [Keyframe[], Keyframe[]] {
    let {
      translateX, translateY, translateXY,
      unitsX, unitsY, unitsXY,
      offsetX, offsetY, offsetXY,
      offsetUnitsX, offsetUnitsY, offsetUnitsXY,
    } = this.translationOptions;

    translateX = translateXY ?? translateX;
    translateY = translateXY ?? translateY;
    unitsX = unitsXY ?? unitsX;
    unitsY = unitsXY ?? unitsY;
    offsetX = offsetXY ?? offsetX;
    offsetY = offsetXY ?? offsetY;
    offsetUnitsX = offsetUnitsXY ?? offsetUnitsX;
    offsetUnitsY = offsetUnitsXY ?? offsetUnitsY;
    
    return [
      // forward
      [{transform: `translate(calc(${translateX}${unitsX} + ${offsetX}${offsetUnitsX}),
                            calc(${translateY}${unitsY} + ${offsetY}${offsetUnitsY})`
      }],

      // backward
      [{transform: `translate(calc(${-translateX}${unitsX} + ${-offsetX}${offsetUnitsX}),
                            calc(${-translateY}${unitsY} + ${-offsetY}${offsetUnitsY})`
      }],
    ];
  }
}

export class TargetedTranslateBlock extends AnimBlock {
  translationOptions: TElem;
  animation: AnimTimelineAnimation;

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {};
  }

  constructor(domElem: Element, private targetElem: Element, userOptions: Partial<AnimBlockOptions> = {}, translationOptions: Partial<TElem> = {}) {
    super(domElem, 'translate', userOptions);

    this.translationOptions = {
      ...this.applyTranslateOptions(translationOptions),
    };

    const [forwardFrames, backwardFrames] = this.createTranslationKeyframes();

    this.animation = new AnimTimelineAnimation(
      new KeyframeEffect(
        domElem,
        forwardFrames,
        {
          duration: this.options.duration,
          fill: 'forwards', // TODO: Make customizable?
          easing: this.options.easing,
          composite: 'accumulate',
          // playbackRate: options.playbackRate, // TODO: implement and uncomment
        }
      ),
      new KeyframeEffect(
        domElem,
        backwardFrames,
        {
          duration: this.options.duration,
          fill: 'forwards', // TODO: Make customizable?
          easing: this.options.easing,
          composite: 'accumulate',
          // playbackRate: options.playbackRate, // TODO: implement and uncomment
        }
      )
    );
  }

  // TODO: Re-implement
  stepForward(): Promise<void> {
    const [newF, newB] = this.createTranslationKeyframes();
    this.animation.setForwardFrames(newF);
    this.animation.setBackwardFrames(newB);
    return super.stepForward();
  }

  protected applyTranslateOptions(translateOptions: Partial<TElem>): TElem {
    return {
      offsetX: 0,
      offsetY: 0,
      offsetUnitsX: 'px',
      offsetUnitsY: 'px',

      alignmentX: 'left',
      alignmentY: 'top',
      offsetTargetX: 0,
      offsetTargetY: 0,
      preserveX: false,
      preserveY: false,

      ...translateOptions,
    };
  }

  private createTranslationKeyframes(): [Keyframe[], Keyframe[]] {
    let {
      alignmentX, alignmentY,
      offsetX, offsetY, offsetXY,
      offsetTargetX, offsetTargetY, offsetTargetXY,
      offsetUnitsX, offsetUnitsY, offsetUnitsXY,
      preserveX, preserveY
    } = this.translationOptions;

    let translateX: number;
    let translateY: number;
    
    // get the bounding boxes of our DOM element and the target element
    // TODO: Find better spot for visibility override
    this.domElem.classList.value += ` wbfk-override-hidden`;
    this.targetElem.classList.value += ` wbfk-override-hidden`;
    const rectThis = this.domElem.getBoundingClientRect();
    const rectTarget = this.targetElem.getBoundingClientRect();
    this.domElem.classList.value = this.domElem.classList.value.replace(` wbfk-override-hidden`, '');
    this.targetElem.classList.value = this.targetElem.classList.value.replace(` wbfk-override-hidden`, '');
    // the displacement will start as the difference between the target element's position and our element's position...
    // ...plus any offset within the target itself
    offsetTargetX = offsetTargetXY ?? offsetTargetX;
    offsetTargetY = offsetTargetXY ?? offsetTargetY;
    translateX = preserveX ? 0 : rectTarget[alignmentX] - rectThis[alignmentX];
    translateX += offsetTargetX * rectTarget.width;
    translateY = preserveY ? 0 : rectTarget[alignmentY] - rectThis[alignmentY];
    translateY += offsetTargetY * rectTarget.height;
    offsetX = offsetXY ?? offsetX;
    offsetY = offsetXY ?? offsetY;
    offsetUnitsX = offsetUnitsXY ?? offsetUnitsX;
    offsetUnitsY = offsetUnitsXY ?? offsetUnitsY;
    
    return [
      // forward
      [{transform: `translate(calc(${translateX}px + ${offsetX}${offsetUnitsX}),
                            calc(${translateY}px + ${offsetY}${offsetUnitsY})`
      }],

      // backward
      [{transform: `translate(calc(${-translateX}px + ${-offsetX}${offsetUnitsX}),
                            calc(${-translateY}px + ${-offsetY}${offsetUnitsY})`
      }],
    ];
  }
}

// TODO: Create util
function mergeArrays<T>(...arrays: T[][]): Array<T> {
  return Array.from(new Set([...arrays.flat()]));
}

