class AnimObject {
  static exitingList = ['fade-out', 'undo--fade-in', 'exit-wipe-to-right', 'undo--enter-wipe-from-right', 'exit-wipe-to-left', 'undo--enter-wipe-from-left'];
  static enteringList = ['fade-in', 'undo--fade-out', 'enter-wipe-from-right', 'undo--exit-wipe-to-right', 'enter-wipe-from-left', 'undo--exit-wipe-to-left'];
  static highlightingList = ['highlight', 'undo--un-highlight'];
  static unhighlightingList = ['un-highlight', 'undo--highlight'];
  static counterParts = {};

  constructor(domElem, animClassName, offsetOptions) {
    this.domElem = domElem;
    this.animClassName = animClassName;
    this.blocksNext = true;
    this.blocksPrev = true;

    if (offsetOptions) { this.applyOptions(offsetOptions); }
  }

  stepForward() {
    return new Promise(resolve => {
      this.animate(this.domElem, this.animClassName, AnimObject.exitingList.includes(this.animClassName), AnimObject.enteringList.includes(this.animClassName))
      .then(() => resolve());
    });
  }

  stepBackward() {
    return new Promise(resolve => {
      const undoAnimation = `undo--${this.animClassName}`;
      this.animate(this.domElem, undoAnimation, AnimObject.exitingList.includes(undoAnimation), AnimObject.enteringList.includes(undoAnimation))
      .then(() => resolve());
    });
  }

  animate(domElem, animClassAdd, isExiting, isEntering) {

    const animation = new Animation();
    animation.effect = new KeyframeEffect(
      domElem,
      AnimObject[animClassAdd],
      {
        duration: 1000,
        fill: 'forwards',
      }
    );
    
    animation.onfinish = () => {
      animation.commitStyles();
      animation.cancel();
    };

    if (isEntering) {
      domElem.classList.remove('hidden');
    }

    animation.play();
    return animation.finished;


    // const removalList = AnimObject.counterParts[animClassAdd];
    // return new Promise(resolve => {
    //   const func = (e) => {
    //     e.stopPropagation();
    //     domElem.removeEventListener('animationend', func);
    //     if (isExiting) { domElem.classList.add('hidden'); }
    //     domElem.classList.remove(...AnimObject.unhighlightingList);
    //     resolve();
    //   }

    //   domElem.style.animationPlayState = 'paused';
    //   domElem.classList.remove(...removalList);
    //   domElem.classList.add(animClassAdd);
    //   if (!isExiting) { domElem.classList.remove('hidden'); }
    //   domElem.addEventListener('animationend', func, {once: true});
    //   domElem.style.animationPlayState = 'running';
    // });
  }

  applyOptions(offsetOptions) {
    const {
      verticalAlignBy = 'top',
      horizontalAlignBy = 'left',
      verticalOffset,
      horizontalOffset,
      blocksNext = true,
      blocksPrev = true,
    } = offsetOptions;
    if ((verticalOffset !== null && verticalOffset !== undefined)) {
      this.domElem.style[verticalAlignBy] = `${verticalOffset}`;
    }
    if ((horizontalOffset !== null && horizontalOffset !== undefined)) {
      this.domElem.style[horizontalAlignBy] = `${horizontalOffset}`;
    }
    this.blocksNext = blocksNext;
    this.blocksPrev = blocksPrev;
  }
}

AnimObject['fade-in'] = AnimObject['undo--fade-out'] = [
  {opacity: '0'},
  {opacity: '1'}
];

AnimObject['fade-out'] = AnimObject['undo--fade-in'] = [
  {opacity: '1'},
  {opacity: '0'}
];

AnimObject['highlight'] = AnimObject['undo--un-highlight'] = [
    {backgroundPositionX: '100%'},
    {backgroundPositionX: '0%'},
];

AnimObject['un-highlight'] = AnimObject['undo--highlight'] = [
  {backgroundPositionX: '0%'},
  {backgroundPositionX: '100%'},
];


AnimObject.exitingList.forEach((animName) => {
  AnimObject.counterParts[animName] = AnimObject.enteringList;
});
AnimObject.enteringList.forEach((animName) => {
  AnimObject.counterParts[animName] = AnimObject.exitingList;
});
AnimObject.highlightingList.forEach((animName) => {
  AnimObject.counterParts[animName] = AnimObject.unhighlightingList;
});
AnimObject.unhighlightingList.forEach((animName) => {
  AnimObject.counterParts[animName] = AnimObject.highlightingList;
});

export default AnimObject;
