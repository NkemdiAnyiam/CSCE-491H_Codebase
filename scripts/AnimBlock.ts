import { Entrances } from "./Presets";

type CustomKeyframeEffectOptions = {
  blocksNext: boolean;
  blocksPrev: boolean;
  commitStyles: boolean;
}

type AnimBlockOptions = Required<Pick<KeyframeEffectOptions, | 'duration' | 'easing' | 'playbackRate'>> & CustomKeyframeEffectOptions;
// TODO: validate duration and playbackRate?

interface TNoElem {
  translateX: number;
  translateY: number;
  translateXY: number; // overrides translateX and translateY
  unitsX: CssLengthUnit;
  unitsY: CssLengthUnit;
  unitsXY: CssLengthUnit; // overrides unitsX and unitsY
}
interface TElem {
  targetElem: HTMLElement; // if specified, translations will be with respect to this target element
  alignmentY: CssYAlignment; // determines vertical alignment with target element
  alignmentX: CssXAlignment; // determines horizontal alignment with target element
  offsetTargetX: number; // offset based target's width (0.5 pushes us 50% of the target element's width rightward)
  offsetTargetY: number; // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  offsetTargetXY: number; // overrides offsetTargetX and offsetTargetY
  preserveX: boolean; // if true, no horizontal translation with respect to the target element (offsets still apply)
  preserveY: boolean; // if true, no vertical translation with respect to the target element (offsets still apply)
  offsetX: number; // determines offset to apply to the respective positional property
  offsetY: number; // determines offset to apply to the respective positional property
  offsetXY: number; // overrides offsetX and offsetY
  offsetUnitsX: CssLengthUnit;
  offsetUnitsY: CssLengthUnit;
  offsetUnitsXY: CssLengthUnit; // overrides offsetUnitsX and offsetUnitsY
}

// type TranslateOptions = {
//   translateX: number;
//   translateY: number;
//   translateXY: number; // overrides translateX and translateY
//   unitsX: CssLengthUnit;
//   unitsY: CssLengthUnit;
//   unitsXY: CssLengthUnit; // overrides unitsX and unitsY

//   targetElem: HTMLElement; // if specified, translations will be with respect to this target element
//   alignmentY: CssYAlignment; // determines vertical alignment with target element
//   alignmentX: CssXAlignment; // determines horizontal alignment with target element
//   offsetTargetX: number; // offset based target's width (0.5 pushes us 50% of the target element's width rightward)
//   offsetTargetY: number; // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
//   offsetTargetXY: number; // overrides offsetTargetX and offsetTargetY
//   preserveX: boolean; // if true, no horizontal translation with respect to the target element (offsets still apply)
//   preserveY: boolean; // if true, no vertical translation with respect to the target element (offsets still apply)
//   offsetX: number; // determines offset to apply to the respective positional property
//   offsetY: number; // determines offset to apply to the respective positional property
//   offsetXY: number; // overrides offsetX and offsetY
//   offsetUnitsX: CssLengthUnit;
//   offsetUnitsY: CssLengthUnit;
//   offsetUnitsXY: CssLengthUnit; // overrides offsetUnitsX and offsetUnitsY
// }

type TranslateOptions = TNoElem | TElem;

type CssLengthUnit = | 'px' | 'rem' | '%';
type CssYAlignment = | 'top' | 'bottom'; // TODO: more options?
type CssXAlignment = | 'left' | 'right'; // TODO: more options?

class AnimTimelineAnimation {
  forwardAnimation: Animation;
  backwardAnimation: Animation;
  constructor(public forwardEffect: KeyframeEffect, public backwardEffect: KeyframeEffect) {
    if (forwardEffect.target !== backwardEffect.target) { throw new Error(`Forward and backward keyframe effects must target the same element`); }
    if (forwardEffect.target == null) { throw new Error(`Animation target must be non-null`); }

    this.forwardAnimation = new Animation(forwardEffect);
    this.backwardAnimation = new Animation(backwardEffect);
  }
  private _timelineID: number = NaN;
  private _sequenceID: number = NaN;

  get timelineID(): number { return this._timelineID; }
  set timelineID(id: number) { this._timelineID = id; }
  get sequenceID(): number { return this._sequenceID; }
  set sequenceID(id: number) { this._sequenceID = id; }
}

export abstract class AnimBlock {

  
  static id: number = 0;

  // static exitingList = [
  //   'fade-out', 'undo--fade-in',
  //   'exit-wipe-to-right', 'undo--enter-wipe-from-right',
  //   'exit-wipe-to-left', 'undo--enter-wipe-from-left',
  //   'exit-wipe-to-top', 'undo--enter-wipe-from-top',
  //   'exit-wipe-to-bottom', 'undo--enter-wipe-from-bottom',
  // ];
  // static enteringList = [
  //   'fade-in', 'undo--fade-out',
  //   'enter-wipe-from-right', 'undo--exit-wipe-to-right',
  //   'enter-wipe-from-left', 'undo--exit-wipe-to-left',
  //   'enter-wipe-from-top', 'undo--exit-wipe-to-top',
  //   'enter-wipe-from-bottom', 'undo--exit-wipe-to-bottom',
  // ];
  // static translatingList = ['translate', 'undo--translate'];
  // static isExiting(animName: string): boolean { return AnimBlock.exitingList.includes(animName); }
  // static isEntering(animName: string): boolean { return AnimBlock.enteringList.includes(animName); }
  // static isTranslating(animName: string): boolean { return AnimBlock.translatingList.includes(animName); }
  // static isBackward(animName: string): boolean { return animName.startsWith('undo--'); }

  parentTimeline?: any; // TODO: specify annotation
  sequenceID: number = NaN; // set to match the id of the parent AnimSequence
  timelineID: number = NaN; // set to match the id of the parent AnimTimeline
  id: number;
  options: AnimBlockOptions;
  abstract animation: AnimTimelineAnimation;

  constructor(public domElem: HTMLElement | SVGGraphicsElement, public animName: string, options: Partial<AnimBlockOptions> = {}) {
    this.id = AnimBlock.id++;

    this.options = this.applyOptions(options);
  }

  getBlocksNext() { return this.options.blocksNext; }
  getBlocksPrev() { return this.options.blocksPrev; }

  setID(idSeq: number, idTimeline: number) {
    [this.sequenceID, this.timelineID] = [idSeq, idTimeline];
    [this.animation.sequenceID, this.animation.timelineID] = [idSeq, idTimeline];
  }

  stepForward(): Promise<void> {
    return new Promise(resolve => {
      this.animate(this.animName, this.animation.forwardAnimation, 'forward')
        .then(() => resolve());
    });
  }

  stepBackward(): Promise<void> {
    return new Promise(resolve => {
      // if (this.animation.backwardAnimation) {
      //   this.animate(this.undoAnimName, this.animation.backwardAnimation)
      //     .then(resolve);
      // }
      // else {
      //   this.animate(this.undoAnimName, this.animation.backwardAnimation)
      //     .then(resolve);
      // }
      this.animate(this.animName, this.animation.backwardAnimation, 'backward')
        .then(() => resolve());
    });
  }

  protected abstract _onFinish(direction: 'forward' | 'backward'): void;
  protected abstract _onStart(direction: 'forward' | 'backward'): void;

  animate(animName: string, animation: Animation, direction: 'forward' | 'backward'): Promise<void> {
    this._onStart(direction);

    // set playback rate
    animation.updatePlaybackRate((this.parentTimeline?.playbackRate ?? 1) * this.options.playbackRate);

    // if (isEntering) {
    //   this.domElem.classList.add('wpfk-override-hidden'); // CHANGE NOTE: Use new hidden classes
    //   // CHANGE NOTE: Removed removal of clip-path and opacity
    // }
    
    // if in skip mode, finish the animation instantly. Otherwise, play through it normally
    this.parentTimeline?.isSkipping || this.parentTimeline?.usingSkipTo ? animation.finish() : animation.play(); // TODO: Move playback rate definition to subclasses?

    // return Promise that fulfills when the animation is completed
    return animation.finished.then(() => {
      // CHANGE NOTE: Move hidden class stuff here
      if (this.options.commitStyles) {
        try {
          animation.commitStyles(); // actually applies the styles to the element
        }
        catch (err) {
          console.warn(err); // TODO: Make more specific
          this.domElem.classList.add('wpfk-override-hidden'); // CHANGE NOTE: Use new hidden classes
          animation.commitStyles();
          this.domElem.classList.remove('wpfk-override-hidden');
        }
      }
      this._onFinish(direction);
      // if (isExiting) { this.domElem.classList.add('wpfk-hidden'); }
      // prevents animations from jumping backward in their execution when duration or playback rate is modified
      animation.cancel();
      // // prevents clipping out nested absolutely-positioned elements outside the bounding box
      // if (isEntering) { this.domElem.style.removeProperty('clip-path'); }
    });
  }

  // createTranslationKeyframes(animName: string) {
  //   let translateX;
  //   let translateY;
  //   let offsetX = this.offsetX;
  //   let offsetY = this.offsetY;

  //   if (this.targetElem) {
  //     if (AnimBlock.isBackward(animName)) {
  //       translateX = this.undoTranslateX;
  //       translateY = this.undoTranslateY;
  //       offsetX *= -1;
  //       offsetY *= -1;
  //     }
  //     else {
  //        // get the bounding boxes of our DOM element and the target element
  //       const rectThis = this.domElem.getBoundingClientRect();
  //       const rectTarget = this.targetElem.getBoundingClientRect();

  //       // the displacement will start as the difference between the target element's position and our element's position...
  //       // ...plus any offset within the target itself
  //       translateX = this.preserveX ? 0 : rectTarget[this.alignmentX] - rectThis[this.alignmentX];
  //       translateX += this.offsetTargetX ? this.offsetTargetX * rectTarget.width : 0;
  //       translateY = this.preserveY ? 0 : rectTarget[this.alignmentY] - rectThis[this.alignmentY];
  //       translateY += this.offsetTargetY ? this.offsetTargetY * rectTarget.height : 0;

  //       // when the animation is rewinded, the negatives will be used to undo the translation
  //       this.undoTranslateX = -translateX;
  //       this.undoTranslateY = -translateY;
  //     }
  //   }
  //   else {
  //     if (AnimBlock.isBackward(animName)) {
  //       translateX = this.undoTranslateX;
  //       translateY = this.undoTranslateY;
  //       offsetX *= -1;
  //       offsetY *= -1;
  //     }
  //     else {
  //       translateX = this.translateX;
  //       translateY = this.translateY;
  //     }
  //   }

  //   return new KeyframeEffect(
  //     this.domElem,
  //     // added to the translations are the offet (with respect to our moving element) if specified
  //     { transform: `translate(calc(${translateX}${this.unitsX} + ${offsetX}${this.offsetUnitsX}),
  //                             calc(${translateY}${this.unitsY} + ${offsetY}${this.offsetUnitsY})`
  //     },
  //     {
  //       duration: this.duration,
  //       fill: 'forwards',
  //       composite: 'accumulate', // this is so that translations can stack
  //     }
  //   );
  // }

  // TODO: Remove unnecessary parameter
  applyOptions(options: Partial<AnimBlockOptions>): AnimBlockOptions {
    return {
      blocksNext: true,
      blocksPrev: true,
      duration: 500,
      playbackRate: 1,
      commitStyles: true,
      easing: 'linear',
    };
  }

  // applyTranslateOptions(translateOptions: TranslateOptions) {
  //   interface TNoElem {
  //     translateX: number;
  //     translateY: number;
  //     translateXY: number; // overrides translateX and translateY
  //     unitsX: CssLengthUnit;
  //     unitsY: CssLengthUnit;
  //     unitsXY: CssLengthUnit; // overrides unitsX and unitsY
  //   }
  //   interface TElem {
  //     targetElem: HTMLElement; // if specified, translations will be with respect to this target element
  //     alignmentY: CssYAlignment; // determines vertical alignment with target element
  //     alignmentX: CssXAlignment; // determines horizontal alignment with target element
  //     offsetTargetX: number; // offset based target's width (0.5 pushes us 50% of the target element's width rightward)
  //     offsetTargetY: number; // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  //     offsetTargetXY: number; // overrides offsetTargetX and offsetTargetY
  //     preserveX: boolean; // if true, no horizontal translation with respect to the target element (offsets still apply)
  //     preserveY: boolean; // if true, no vertical translation with respect to the target element (offsets still apply)
  //     offsetX: number; // determines offset to apply to the respective positional property
  //     offsetY: number; // determines offset to apply to the respective positional property
  //     offsetXY: number; // overrides offsetX and offsetY
  //     offsetUnitsX: CssLengthUnit;
  //     offsetUnitsY: CssLengthUnit;
  //     offsetUnitsXY: CssLengthUnit; // overrides offsetUnitsX and offsetUnitsY
  //   }
  //   type TranslateOptions = TNoElem | TElem;
    
  //   // const {
  //   //   translateX = 0,
  //   //   translateY = 0,
  //   //   translateXY, // overrides translateX and translateY
  //   //   unitsX = 'px',
  //   //   unitsY = 'px',
  //   //   unitsXY, // overrides unitsX and unitsY

  //   //   targetElem, // if specified, translations will be with respect to this target element
  //   //   alignmentY = 'top', // determines vertical alignment with target element
  //   //   alignmentX = 'left', // determines horizontal alignment with target element
  //   //   offsetTargetX = 0, // offset based target's width (0.5 pushes us 50% of the target element's width rightward)
  //   //   offsetTargetY = 0, // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  //   //   offsetTargetXY, // overrides offsetTargetX and offsetTargetY
  //   //   preserveX = false, // if true, no horizontal translation with respect to the target element (offsets still apply)
  //   //   preserveY = false, // if true, no vertical translation with respect to the target element (offsets still apply)
  //   //   offsetX = 0, // determines offset to apply to the respective positional property
  //   //   offsetY = 0, // determines offset to apply to the respective positional property
  //   //   offsetXY, // overrides offsetX and offsetY
  //   //   offsetUnitsX = 'px',
  //   //   offsetUnitsY = 'px',
  //   //   offsetUnitsXY, // overrides offsetUnitsX and offsetUnitsY
  //   // } = translateOptions;

  //   const { targetElem } = translateOptions;

  //   // const wholeTranslateOptions: TranslateOptions = {
  //   //   translateX: translateXY ?? translateX ?? 0,
  //   //   translateY: translateXY ?? translateY ?? 0,
  //   //   translateXY: translateXY ?? undefined,
  //   //   unitsX: unitsXY ?? unitsX ?? 'px',
  //   //   unitsY: unitsXY ?? unitsY ?? 'px',
  //   //   unitsXY: unitsXY ?? undefined,

  //   //   targetElem,
  //   //   alignmentY: alignmentY ?? 'top',
  //   //   alignmentX: alignmentX ?? 'left',
  //   //   offsetTargetX: offsetTargetXY ?? offsetTargetX ?? 0,
  //   //   offsetTargetY: offsetTargetXY ?? offsetTargetY ?? 0,
  //   //   offsetTargetXY: offsetTargetXY ?? undefined,
  //   //   preserveX: preserveX ?? false,
  //   //   preserveY: preserveY ?? false,
  //   //   offsetX: offsetXY ?? offsetX ?? 0,
  //   //   offsetY: offsetXY ?? offsetY ?? 0,
  //   //   offsetXY: offsetXY ?? 0,
  //   //   offsetUnitsX: offsetUnitsXY ?? offsetUnitsX ?? 'px',
  //   //   offsetUnitsY: offsetUnitsXY ?? offsetUnitsY ?? 'px',
  //   //   offsetUnitsXY: offsetUnitsXY ?? undefined,
  //   // };

  //   if ('targetElem' in translateOptions) {
  //     this.targetElem = targetElem;

  //     this.alignmentX = alignmentX;
  //     this.alignmentY = alignmentY;

  //     this.unitsX = 'px';
  //     this.unitsY = 'px';

  //     this.offsetTargetX = offsetTargetXY ?? offsetTargetX;
  //     this.offsetTargetY = offsetTargetXY ?? offsetTargetY;

  //     this.preserveX = preserveX;
  //     this.preserveY = preserveY;

  //     const {
  //       targetElem, // if specified, translations will be with respect to this target element
  //       alignmentY = 'top', // determines vertical alignment with target element
  //       alignmentX = 'left', // determines horizontal alignment with target element
  //       offsetTargetX = 0, // offset based target's width (0.5 pushes us 50% of the target element's width rightward)
  //       offsetTargetY = 0, // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  //       offsetTargetXY, // overrides offsetTargetX and offsetTargetY
  //       preserveX = false, // if true, no horizontal translation with respect to the target element (offsets still apply)
  //       preserveY = false, // if true, no vertical translation with respect to the target element (offsets still apply)
  //       offsetX = 0, // determines offset to apply to the respective positional property
  //       offsetY = 0, // determines offset to apply to the respective positional property
  //       offsetXY, // overrides offsetX and offsetY
  //       offsetUnitsX = 'px',
  //       offsetUnitsY = 'px',
  //       offsetUnitsXY, // overrides offsetUnitsX and offsetUnitsY
  //     } = translateOptions;

  //     const wholeTranslateOptions: TranslateOptions = {
  //       targetElem,
  //       alignmentY: alignmentY ?? 'top',
  //       alignmentX: alignmentX ?? 'left',
  //       offsetTargetX: offsetTargetXY ?? offsetTargetX ?? 0,
  //       offsetTargetY: offsetTargetXY ?? offsetTargetY ?? 0,
  //       offsetTargetXY: offsetTargetXY ?? undefined,
  //       preserveX: preserveX ?? false,
  //       preserveY: preserveY ?? false,
  //       offsetX: offsetXY ?? offsetX ?? 0,
  //       offsetY: offsetXY ?? offsetY ?? 0,
  //       offsetXY: offsetXY ?? 0,
  //       offsetUnitsX: offsetUnitsXY ?? offsetUnitsX ?? 'px',
  //       offsetUnitsY: offsetUnitsXY ?? offsetUnitsY ?? 'px',
  //       offsetUnitsXY: offsetUnitsXY ?? undefined,
  //     };
  //   }
  //   else {
  //     this.translateX = translateXY ?? translateX;
  //     this.undoTranslateX = -this.translateX;
  //     this.translateY = translateXY ?? translateY;
  //     this.undoTranslateY = -this.translateY;

  //     this.unitsX = unitsXY ?? unitsX;
  //     this.unitsY = unitsXY ?? unitsY;
  //   }

  //   this.offsetX = offsetXY ?? offsetX;
  //   this.offsetY = offsetXY ?? offsetY;
  //   this.offsetUnitsX = offsetUnitsXY ?? offsetUnitsX;
  //   this.offsetUnitsY = offsetUnitsXY ?? offsetUnitsY;
  // }
}

type AnimNames<TBank> = {
  [AnimName in keyof TBank as TBank[AnimName] extends Keyframe[] ? AnimName : never]: TBank[AnimName];
}

export class EntranceBlock extends AnimBlock {
  animation: AnimTimelineAnimation;
  
  constructor(domElem: HTMLElement | SVGGraphicsElement, animName: keyof AnimNames<typeof Entrances>, options: Partial<AnimBlockOptions> = {}) {
    super(domElem, animName);
    this.id = AnimBlock.id++;

    // Create the Animation instance that we will use on our DOM element
    const forwardFrames: Keyframe[] = Entrances[animName];
    if (!forwardFrames) { throw new Error(`Invalid entrance animation name "${animName}"`); }

    // if an explicit definition for reversal frames exists, use them.
    // otherwise, use the reverse of the forward frames
    let backwardFrames: Keyframe[];
    const undoAnimationName = `undo--${animName}`;
    backwardFrames = (undoAnimationName in Entrances) ?
      Entrances[undoAnimationName as typeof animName] :
      [...forwardFrames].reverse();

    const keyframeOptions: KeyframeEffectOptions = {
      duration: options.duration,
      fill: options.commitStyles ? 'forwards' : 'none',
      easing: options.easing,
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
        keyframeOptions
      ),
    );
  }

  protected _onStart(direction: 'forward' | 'backward'): void {
    if (direction === 'forward') {
      this.domElem.classList.remove('wbfk-hidden');
    }
  }

  protected _onFinish(direction: "forward" | "backward"): void {
    if (direction === 'backward') {
      this.domElem.classList.add('wbfk-hidden');
    }
  }

  applyOptions(options: Partial<AnimBlockOptions>): AnimBlockOptions {
    return {
      ...super.applyOptions(options),
      // TODO: consider commitStyles: false as default
      ...options,
    };
  }
}


// //******** ANIMATION PRESETS
// //*** Fade
// AnimBlock['fade-in'] = AnimBlock['undo--fade-out'] = [
//   {opacity: '0'},
//   {opacity: '1'}
// ];

// AnimBlock['fade-out'] = AnimBlock['undo--fade-in'] = [
//   {opacity: '1'},
//   {opacity: '0'}
// ];


// //*** Highlight
// AnimBlock['highlight'] = AnimBlock['undo--un-highlight'] = [
//     {backgroundPositionX: '100%'},
//     {backgroundPositionX: '0%'},
// ];

// AnimBlock['un-highlight'] = AnimBlock['undo--highlight'] = [
//   {backgroundPositionX: '0%'},
//   {backgroundPositionX: '100%'},
// ];


// //*** Wipe
// // To/From Right
// AnimBlock['enter-wipe-from-right'] = AnimBlock['undo--exit-wipe-to-right'] = [
//   {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
// ];

// AnimBlock['exit-wipe-to-right'] = AnimBlock['undo--enter-wipe-from-right'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
// ];

// // To/From Left
// AnimBlock['enter-wipe-from-left'] = AnimBlock['undo--exit-wipe-to-left'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
// ];

// AnimBlock['exit-wipe-to-left'] = AnimBlock['undo--enter-wipe-from-left'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
// ];

// // To/From Top
// AnimBlock['enter-wipe-from-top'] = AnimBlock['undo--exit-wipe-to-top'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
// ];

// AnimBlock['exit-wipe-to-top'] = AnimBlock['undo--enter-wipe-from-top'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
// ];

// // To/From Bottom
// AnimBlock['enter-wipe-from-bottom'] = AnimBlock['undo--exit-wipe-to-bottom'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
// ];

// AnimBlock['exit-wipe-to-bottom'] = AnimBlock['undo--enter-wipe-from-bottom'] = [
//   {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
// ];


// //*** Wipe
// // To/From Right
// AnimBlock['enter-wipe-from-right'] = AnimBlock['undo--exit-wipe-to-right'] = [
//   {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
// ];

// AnimBlock['exit-wipe-to-right'] = AnimBlock['undo--enter-wipe-from-right'] = [
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
//   {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
// ];

// // To/From Left
// AnimBlock['enter-wipe-from-left'] = AnimBlock['undo--exit-wipe-to-left'] = [
//   {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
// ];

// AnimBlock['exit-wipe-to-left'] = AnimBlock['undo--enter-wipe-from-left'] = [
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
//   {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
// ];

// // To/From Top
// AnimBlock['enter-wipe-from-top'] = AnimBlock['undo--exit-wipe-to-top'] = [
//   {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
// ];

// AnimBlock['exit-wipe-to-top'] = AnimBlock['undo--enter-wipe-from-top'] = [
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
//   {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
// ];

// // To/From Bottom
// AnimBlock['enter-wipe-from-bottom'] = AnimBlock['undo--exit-wipe-to-bottom'] = [
//   {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
// ];

// AnimBlock['exit-wipe-to-bottom'] = AnimBlock['undo--enter-wipe-from-bottom'] = [
//   {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
//   {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
// ];

