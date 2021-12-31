class IntervalController {
  intervalID = null;

  setIntervalID(func, time) {
    this.intervalID = setInterval(func, time);
  }

  clearIntervalID() {
    clearInterval(this.intervalID);
    this.intervalID = null;
  }
}

class AnimLineUpdater {
  static registerDomElem(domElem) {
    if (!AnimLineUpdater.domElemMap.has(domElem)) {
      AnimLineUpdater.domElemMap.set(domElem, new IntervalController())
    }
  }

  static setInterval(domElem, func) {
    AnimLineUpdater.domElemMap.get(domElem).setIntervalID(func, 100)
  }

  static clearInterval(domElem) {
    AnimLineUpdater.domElemMap.get(domElem).clearIntervalID()
  }
}

AnimLineUpdater.domElemMap = new Map();

export default AnimLineUpdater;
