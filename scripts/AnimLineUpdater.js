export class AnimLineUpdater {
  static domElemMap = new Map(); // maps an IntervalController to an <svg> element

  // if the DOM element is not present in the map, is is added along with a new IntervalController
  static registerDomElem(domElem) {
    if (!AnimLineUpdater.domElemMap.has(domElem)) {
      AnimLineUpdater.domElemMap.set(domElem, new IntervalController());
    }
  }

  static setInterval(domElem, func) {
    // get the IntervalController associated with the DOM element and set an interval to periodically call udpateEndpoints()
    AnimLineUpdater.domElemMap.get(domElem).setIntervalID(func, 25); // updateEndpoints() for a given line will be called every 100 milliseconds
  }

  static clearInterval(domElem) {
    // remove the interval associated with the DOM element
    AnimLineUpdater.domElemMap.get(domElem).clearIntervalID();
  }
}

// IntervalController is used to set or clear intervals. Because AnimLineUpdater.domElemMap bases its mapping on a DOM element,...
// ... any AnimLine that uses the same <svg> element for its line will essentially share an IntervalController,...
// ... allowing separate AnimLine instances to turn on/off intervals for updateEndpoints() for the same line
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
