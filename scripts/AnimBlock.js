//TODO: move wait() to a utility file
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export class AnimBlock {
  static exitingList = ['fade-out', 'undo--fade-in', 'exit-wipe-to-right', 'undo--enter-wipe-from-right', 'exit-wipe-to-left', 'undo--enter-wipe-from-left'];
  static enteringList = ['fade-in', 'undo--fade-out', 'enter-wipe-from-right', 'undo--exit-wipe-to-right', 'enter-wipe-from-left', 'undo--exit-wipe-to-left'];
  static highlightingList = ['highlight', 'undo--un-highlight'];
  static unhighlightingList = ['un-highlight', 'undo--highlight'];
  static translatingList = ['translate', 'undo--translate'];
  static isExiting(animName) { return AnimBlock.exitingList.includes(animName); }
  static isEntering(animName) { return AnimBlock.enteringList.includes(animName); }
  static isTranslating(animName) { return AnimBlock.translatingList.includes(animName); }
  static isBackward(animName) { return animName.startsWith('undo--'); }
  static skipDuration = 50; // see handleSkipSignal()

  timelineID; // set to match the id of the AnimSequence to which it belongs, which matches the id of the parent timeline
  // Determines whether or not the upcoming animation should wait for this one to finish (can be changed in applyOptions())
  blocksNext = true;
  blocksPrev = true;
  duration = 500;

  constructor(domElem, animName, options) {
    this.domElem = domElem;
    this.animName = animName;
    this.undoAnimName = `undo--${this.animName}`;

    this.applyOptions(options);
  }

  getBlocksNext() { return this.blocksNext; }
  getBlocksPrev() { return this.blocksPrev; }

  setID(id) { this.timelineID = id; }

  stepForward() {
    return new Promise(resolve => {
      this.animate(this.animName)
      .then(() => resolve());
    });
  }

  stepBackward() {
    return new Promise(resolve => {
      this.animate(this.undoAnimName)
      .then(() => resolve());
    });
  }

  animate(animName) {
    const isExiting = AnimBlock.isExiting(animName);
    const isEntering = AnimBlock.isEntering(animName);
    const isTranslating = AnimBlock.isTranslating(animName);

    // Create the Animation instance that we will use on our DOM element
    const animation = new Animation();
    animation.id = this.timelineID;

    // set the keyframes for the animation
    if (isTranslating) { animation.effect = this.createTranslationKeyframes(animName); }
    else { animation.effect = this.getPresetKeyframes(animName); }

    if (isEntering) { this.domElem.classList.remove('hidden'); }
    // if in skip mode, finish the animation instantly. Otherwise, play through it normally
    this.shouldSkip ? animation.finish() : animation.play();

    // return Promise that fulfills when the animation is completed
    return animation.finished.then(() => {
      animation.commitStyles(); // actually applies the styles to the element
      if (isExiting) { this.domElem.classList.add('hidden'); }
      animation.cancel(); // prevents a weird bug(?) where animations are able to jump backwards in their execution if the duration or playback rate is modified
    });
  }

  getPresetKeyframes(animName) {
    return new KeyframeEffect(
      this.domElem,
      AnimBlock[animName], // gets transformations from appropriate static property on AnimBlock
      {
        duration: this.duration, // TODO: potentially allow variable duration values (both forwards and backwards)
        fill: 'forwards', // makes it so that the styles visually stick after the animation is finished (helps us commit them latter)
      }
    );
  }

  createTranslationKeyframes(animName) {
    let translateX;
    let translateY;
    let offsetX = this.offsetX;
    let offsetY = this.offsetY;
    
    if (AnimBlock.isBackward(animName)) {
      translateX = this.undoTranslateX;
      translateY = this.undoTranslateY;
      offsetX *= -1;
      offsetY *= -1;
    }
    else if (this.targetElem) {
      // get the bounding boxes of our DOM element and the target element
      const rectThis = this.domElem.getBoundingClientRect();
      const rectTarget = this.targetElem.getBoundingClientRect();

      // the displacement will be the difference between the target element's position and our element's position
      translateX = this.preserveX ? 0 : rectTarget[this.alignmentX] - rectThis[this.alignmentX];
      translateY = this.preserveY ? 0 : rectTarget[this.alignmentY] - rectThis[this.alignmentY];

      // when the animation is rewinded, the negatives will be used to undo the translation
      this.undoTranslateX = -translateX;
      this.undoTranslateY = -translateY;
    }
    else {
      translateX = this.translateX;
      translateY = this.translateY;
    }

    return new KeyframeEffect(
      this.domElem,
      { transform: `translate(calc(${translateX}${this.unitsX} + ${offsetX}${this.offsetUnitsX}),
                              calc(${translateY}${this.unitsY} + ${offsetY}${this.offsetUnitsY})`
      },
      {
        duration: this.duration,
        fill: 'forwards',
        composite: 'accumulate',
      }
    );
  }
  
  // short burst of shouldSkip that, if done prior to the animation playing, allows the animation to be finished instantly
  handleSkipSignal() {
    this.shouldSkip = true;
    wait(AnimBlock.skipDuration)
    .then(() => this.shouldSkip = false);
  }

  applyOptions(options) {
    if (!options) { return; }
    
    const {
      blocksNext,
      blocksPrev,
      duration,
      translateOptions,
    } = options;

    this.blocksNext = blocksNext ?? this.blocksNext;
    this.blocksPrev = blocksPrev ?? this.blocksPrev;
    this.duration = duration ?? this.duration;

    if (translateOptions) {
      this.applyTranslateOptions(translateOptions);
    }
  }

  applyTranslateOptions(translateOptions) {
    const {
      translateX = 0,
      translateY = 0,
      translateXY, // overrides translateX and translateY
      unitsX = 'px',
      unitsY = 'px',
      unitsXY, // overrides unitsX and unitsY
      targetElem,
      alignmentY = 'top', // determines vertical alignment with target element
      alignmentX = 'left', // determines horizontal alignment with target element
      offsetX = 0, // determines offset to apply to the respective positional property
      offsetY = 0, // determines offset to apply to the respective positional property
      offsetXY, // overrides offsetX and offsetY
      offsetUnitsX = 'px',
      offsetUnitsY = 'px',
      offsetUnitsXY, // overrides offsetUnitsX and offsetUnitsY
      preserveX = false,
      preserveY = false,
    } = translateOptions;

    if (targetElem) {
      this.targetElem = targetElem;

      this.alignmentX = alignmentX;
      this.alignmentY = alignmentY;

      this.unitsX = 'px';
      this.unitsY = 'px';

      this.preserveX = preserveX;
      this.preserveY = preserveY;
    }
    else {
      this.translateX = translateXY ?? translateX;
      this.undoTranslateX = -this.translateX;
      this.translateY = translateXY ?? translateY;
      this.undoTranslateY = -this.translateY;

      this.unitsX = unitsXY ?? unitsX;
      this.unitsY = unitsXY ?? unitsY;
    }

    this.offsetX = offsetXY ?? offsetX;
    this.offsetY = offsetXY ?? offsetY;
    this.offsetUnitsX = offsetUnitsXY ?? offsetUnitsX;
    this.offsetUnitsY = offsetUnitsXY ?? offsetUnitsY;
  }
}


//******** TRANSFORMATION PRESETS
//*** Fade
AnimBlock['fade-in'] = AnimBlock['undo--fade-out'] = [
  {opacity: '0'},
  {opacity: '1'}
];

AnimBlock['fade-out'] = AnimBlock['undo--fade-in'] = [
  {opacity: '1'},
  {opacity: '0'}
];

//*** Highlight
AnimBlock['highlight'] = AnimBlock['undo--un-highlight'] = [
    {backgroundPositionX: '100%'},
    {backgroundPositionX: '0%'},
];

AnimBlock['un-highlight'] = AnimBlock['undo--highlight'] = [
  {backgroundPositionX: '0%'},
  {backgroundPositionX: '100%'},
];

//*** Wipe
// To/From Right
AnimBlock['enter-wipe-from-right'] = AnimBlock['undo--exit-wipe-to-right'] = [
  {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
]

AnimBlock['exit-wipe-to-right'] = AnimBlock['undo--enter-wipe-from-right'] = [
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
  {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
];

// To/From Left
AnimBlock['enter-wipe-from-left'] = AnimBlock['undo--exit-wipe-to-left'] = [
  {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
]

AnimBlock['exit-wipe-to-left'] = AnimBlock['undo--enter-wipe-from-left'] = [
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
  {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
];
