import AnimObject from "./AnimObject.js";

class AnimLine extends AnimObject {
  constructor(domElem, animClassName, startElem, endElem) {
    super(domElem, animClassName);
    this.startElem = startElem;
    this.endElem = endElem;
  }

  updateEndPoints() {
    const rectStart = this.startElem.getBoundingClientRect();
    const rectEnd = this.endElem.getBoundingClientRect();
    const rectParent = this.domElem.parentElement.getBoundingClientRect();

    const line = this.domElem.querySelector('.arrow-line');
    this.domElem.style.left = -rectParent.left;
    this.domElem.style.top = -rectParent.top;
    line.x1.baseVal.value = rectStart.left;
    line.y1.baseVal.value = rectStart.top;
    line.x2.baseVal.value = rectEnd.left;
    line.y2.baseVal.value = rectEnd.bottom;
    console.log(line);
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
