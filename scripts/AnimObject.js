//TODO: move wait() to a utility file
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export class AnimObject {
  static exitingList = ['fade-out', 'undo--fade-in', 'exit-wipe-to-right', 'undo--enter-wipe-from-right', 'exit-wipe-to-left', 'undo--enter-wipe-from-left'];
  static enteringList = ['fade-in', 'undo--fade-out', 'enter-wipe-from-right', 'undo--exit-wipe-to-right', 'enter-wipe-from-left', 'undo--exit-wipe-to-left'];
  static highlightingList = ['highlight', 'undo--un-highlight'];
  static unhighlightingList = ['un-highlight', 'undo--highlight'];
  static translatingList = ['translate', 'undo--translate'];
  static skipDuration = 50; // see handleSkipSignal()

  timelineID; // set to match the id of the AnimBlock to which it belongs, which matches the id of the parent timeline
  // Determines whether or not the upcoming animation should wait for this one to finish (can be changed in applyOptions())
  blocksNext = true;
  blocksPrev = true;

  constructor(domElem, animName, options) {
    this.domElem = domElem;
    this.animName = animName;

    this.applyOptions(options);
  }

  getBlockNext() { return this.blocksNext; }
  getBlockPrev() { return this.blocksPrev; }

  stepForward() {
    return new Promise(resolve => {
      this.animate(this.domElem, this.animName, AnimObject.isExiting(this.animName), AnimObject.isEntering(this.animName), AnimObject.isTranslating(this.animName))
      .then(() => resolve());
    });
  }

  stepBackward() {
    return new Promise(resolve => {
      const undoAnimName = `undo--${this.animName}`;
      this.animate(this.domElem, undoAnimName, AnimObject.isExiting(undoAnimName), AnimObject.isEntering(undoAnimName), AnimObject.isTranslating(undoAnimName))
      .then(() => resolve());
    });
  }

  static isExiting(animName) { return AnimObject.exitingList.includes(animName); }
  static isEntering(animName) { return AnimObject.enteringList.includes(animName); }
  static isTranslating(animName) { return AnimObject.translatingList.includes(animName); }
  static isBackward(animName) { return animName.startsWith('undo--'); }

  animate(domElem, animClassAdd, isExiting, isEntering, isTranslating) {
    // Create the Animation instance that we will use on our DOM element
    const animation = new Animation();
    animation.id = this.timelineID;

    // set the keyframes for the animation
    if (isTranslating) {
      animation.effect = this.createTranslationKeyframes(animClassAdd);
    }
    else {
      animation.effect = new KeyframeEffect(
        domElem,
        AnimObject[animClassAdd], // gets transformations from appropriate static property on AnimObject
        {
          duration: 500, // TODO: potentially allow variable duration values (both forwards and backwards)
          fill: 'forwards', // makes it so that the styles visually stick after the animation is finished (helps us commit them latter)
        }
      );
    }
    
    animation.onfinish = () => {
      animation.commitStyles(); // actually applies the styles to the element
      if (isExiting) { domElem.classList.add('hidden'); }
      animation.cancel(); // prevents a weird bug(?) where animations are able to jump backwards in their execution if the duration or playback rate is modified
    };

    if (isEntering) { domElem.classList.remove('hidden'); }
    // if in skip mode, finish the animation instantly. Otherwise, play through it normally
    this.shouldSkip ? animation.finish() : animation.play();
    // return Promise that fulfills when the animation is completed

    return animation.finished;
  }

  createTranslationKeyframes(animClassAdd) {
    let translateX;
    let translateY;
    let offsetX = this.offsetX;
    let offsetY = this.offsetY;
    
    if (AnimObject.isBackward(animClassAdd)) {
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
      translateX = rectTarget[this.alignmentX] - rectThis[this.alignmentX];
      translateY = rectTarget[this.alignmentY] - rectThis[this.alignmentY];

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
        duration: 500,
        fill: 'forwards',
        composite: 'accumulate',
      }
    );
  }
  
  // short burst of shouldSkip that, if done prior to the animation playing, allows the animation to be finished instantly
  async handleSkipSignal() {
    this.shouldSkip = true;
    await wait(AnimObject.skipDuration);
    this.shouldSkip = false;
  }

  applyOptions(options) {
    if (!options) { return; }
    
    const {
      blocksNext,
      blocksPrev,
      translateOptions,
    } = options;

    this.blocksNext = blocksNext ?? this.blocksNext;
    this.blocksPrev = blocksPrev ?? this.blocksPrev;

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
    } = translateOptions;

    if (targetElem) {
      this.targetElem = targetElem;

      this.alignmentX = alignmentX;
      this.alignmentY = alignmentY;

      this.unitsX = 'px';
      this.unitsY = 'px';
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

  setID(id) {
    this.timelineID = id;
  }
}


//******** TRANSFORMATION PRESETS
//*** Fade
AnimObject['fade-in'] = AnimObject['undo--fade-out'] = [
  {opacity: '0'},
  {opacity: '1'}
];

AnimObject['fade-out'] = AnimObject['undo--fade-in'] = [
  {opacity: '1'},
  {opacity: '0'}
];

//*** Highlight
AnimObject['highlight'] = AnimObject['undo--un-highlight'] = [
    {backgroundPositionX: '100%'},
    {backgroundPositionX: '0%'},
];

AnimObject['un-highlight'] = AnimObject['undo--highlight'] = [
  {backgroundPositionX: '0%'},
  {backgroundPositionX: '100%'},
];

//*** Wipe
// To/From Right
AnimObject['enter-wipe-from-right'] = AnimObject['undo--exit-wipe-to-right'] = [
  {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
]

AnimObject['exit-wipe-to-right'] = AnimObject['undo--enter-wipe-from-right'] = [
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
  {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
];

// To/From Left
AnimObject['enter-wipe-from-left'] = AnimObject['undo--exit-wipe-to-left'] = [
  {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
]

AnimObject['exit-wipe-to-left'] = AnimObject['undo--enter-wipe-from-left'] = [
  {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
  {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
];
