import AnimObject from "./AnimObject.js";

class AnimLine extends AnimObject {
  constructor(domElem, animClassName, startElem, [left1, top1], endElem, [left2, top2]) {
    super(domElem, animClassName);
    this.startElem = startElem ? startElem : this.domElem.previousElementSibling;
    this.endElem = endElem ? endElem : this.domElem.previousElementSibling;
    this.left1 = left1;
    this.top1 = top1;
    this.left2 = left2;
    this.top2 = top2;
  }

  updateEndPoints() {
    const rectStart = this.startElem.getBoundingClientRect();
    const rectEnd = this.endElem.getBoundingClientRect();
    const rectParent = this.domElem.parentElement.getBoundingClientRect();

    this.domElem.style.left = -rectParent.left - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderLeftWidth);
    this.domElem.style.top = -rectParent.top - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderTopWidth);

    const line = this.domElem.querySelector('.arrow-line');
    line.x1.baseVal.value = (1 - this.left1) * rectStart.left + (this.left1) * rectStart.right;
    line.y1.baseVal.value = (1 - this.top1) * rectStart.top + (this.top1) * rectStart.bottom;
    line.x2.baseVal.value = (1 - this.left2) * rectEnd.left + (this.left2) * rectEnd.right;
    line.y2.baseVal.value = (1 - this.top2) * rectEnd.top + (this.top2) * rectEnd.bottom;
  }

  stepForward() {
    return new Promise(resolve => {
      if (AnimObject.enteringList.includes(this.animClassName)) {
        this.updateEndPoints();
      }
      super.stepForward()
      .then(() => resolve());
    });
  }
}

export default AnimLine;
