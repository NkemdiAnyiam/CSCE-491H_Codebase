import AnimObject from "./AnimObject.js";
import AnimLineUpdater from "./AnimLineUpdater.js";

class AnimLine extends AnimObject {
  constructor(domElem, animClassName, startElem, [left1, top1], endElem, [left2, top2], options) {
    super(domElem, animClassName, options);
    AnimLineUpdater.registerDomElem(this.domElem);
    this.startElem = startElem ? startElem : this.domElem.previousElementSibling;
    this.endElem = endElem ? endElem : this.domElem.previousElementSibling;
    this.left1 = left1;
    this.top1 = top1;
    this.left2 = left2;
    this.top2 = top2;

    this.applyOptions(options);
  }

  updateEndPoints() {
    const rectStart = this.startElem.getBoundingClientRect();
    const rectEnd = this.endElem.getBoundingClientRect();
    const rectParent = this.domElem.parentElement.getBoundingClientRect();

    const SVGLeftOffset = -rectParent.left - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderLeftWidth);
    const SVGTopOffset = -rectParent.top - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderTopWidth);

    const line = this.domElem.querySelector('.free-line__line');
    line.x1.baseVal.value = (1 - this.left1) * rectStart.left + (this.left1) * rectStart.right + SVGLeftOffset;
    line.y1.baseVal.value = (1 - this.top1) * rectStart.top + (this.top1) * rectStart.bottom + SVGTopOffset;
    line.x2.baseVal.value = (1 - this.left2) * rectEnd.left + (this.left2) * rectEnd.right + SVGLeftOffset;
    line.y2.baseVal.value = (1 - this.top2) * rectEnd.top + (this.top2) * rectEnd.bottom + SVGTopOffset;
  }

  stepForward() {
    return new Promise(resolve => {
      if (this.updateOnEntry && AnimObject.enteringList.includes(this.animClassName)) {
        this.updateEndPoints();

        if (this.continuousUpdates) {
          AnimLineUpdater.setInterval(this.domElem, this.updateEndPoints.bind(this));
        }
      }

      if (AnimObject.exitingList.includes(this.animClassName)) {
        AnimLineUpdater.clearInterval(this.domElem);
      }

      super.stepForward()
      .then(() => resolve());
    });
  }

  stepBackward() {
    return new Promise(resolve => {
      if (this.updateOnEntry && AnimObject.enteringList.includes(`undo--${this.animClassName}`)) {
        this.updateEndPoints();

        if (this.continuousUpdates) {
          AnimLineUpdater.setInterval(this.domElem, this.updateEndPoints.bind(this));
        }
      }

      if (AnimObject.exitingList.includes(`undo--${this.animClassName}`)) {
        AnimLineUpdater.clearInterval(this.domElem);
      }

      super.stepBackward()
      .then(() => resolve());
    });
  }

  applyOptions(options) {
    if (!options) { return; }

    super.applyOptions();
    const {
      updateOnEntry = true,
      continuousUpdates = true,
    } = options;
    this.updateOnEntry = updateOnEntry;
    this.continuousUpdates = continuousUpdates;
  }
}

export default AnimLine;
