class AnimObject {
  static exitingList = ['fade-out', 'undo--fade-in', 'exit-wipe-to-right', 'undo--enter-wipe-from-right', 'exit-wipe-to-left', 'undo--enter-wipe-from-left'];
  static enteringList = ['fade-in', 'undo--fade-out', 'enter-wipe-from-right', 'undo--exit-wipe-to-right', 'enter-wipe-from-left', 'undo--exit-wipe-to-left'];
  static highlightingList = ['highlight', 'undo--un-highlight'];
  static unhighlightingList = ['un-highlight', 'undo--highlight'];
  static counterParts = {};

  static stepForward(domElem, animClassName) {
    return new Promise(resolve => {
      (AnimObject.exitingList.includes(animClassName) ?
        AnimObject.animate(domElem, animClassName, true) :
        AnimObject.animate(domElem, animClassName, false)
      )
      .then(() => {
        resolve();
      });
    });
  }

  static stepBackward(domElem, animClassName) {
    return new Promise(resolve => {
      const animation = `undo--${animClassName}`;
      (AnimObject.exitingList.includes(animation) ?
        AnimObject.animate(domElem, animation, true) :
        AnimObject.animate(domElem, animation, false)
      )
      .then(() => resolve());
    });
  }

  static animate(domElem, animClassAdd, isExiting) {
    const removalList = AnimObject.counterParts[animClassAdd];
    return new Promise(resolve => {
      const func = () => {
        domElem.removeEventListener('animationend', func);
        if (isExiting) {
          domElem.classList.add('hidden');
          domElem.classList.remove(...AnimObject.unhighlightingList);
        }
        resolve();
      }

      domElem.style.animationPlayState = 'paused';
      domElem.classList.remove(...removalList);
      domElem.classList.add(animClassAdd);
      if (!isExiting) { domElem.classList.remove('hidden'); }
      domElem.addEventListener('animationend', func);
      domElem.style.animationPlayState = 'running';
    });
  }
}

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
