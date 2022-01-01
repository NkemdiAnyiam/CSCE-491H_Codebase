import { AnimObject } from "./AnimObject.js";
import { AnimLineUpdater } from "./AnimLineUpdater.js";

export class AnimLine extends AnimObject {
  // the defaults of both updateOnEntry and continuousUpdates can be replaced in applyOptions()
  updateOnEntry = true; // determines whether or not to call updateEndPoints() upon using an entering animation
  continuousUpdates = true; // determines whether or not to continuously periodically called updateEndPoints() while visible

  constructor(domElem, animName, startElem, [leftStart, topStart], endElem, [leftEnd, topEnd], options) {
    super(domElem, animName, options);

    AnimLineUpdater.registerDomElem(this.domElem); // enables any AnimLines using the same DOM element as us to effectively toggle the continuous updates

    // set the reference points for the start and end of the line (our <svg> element's nested <line>).
    // Defaults to the sibling DOM element above our DOM element
    this.startElem = startElem ? startElem : this.domElem.previousElementSibling;
    this.endElem = endElem ? endElem : this.domElem.previousElementSibling;

    // set the values used for the endpoint offsets relative to the top-left of each reference element
    this.leftStart = leftStart; // a value of 0 leaves the starting endpoint on the left edge of startElem. 0.5 centers it horizontally within startElem
    this.topStart = topStart; // a value of 0 leaves the starting endpoint on the top edge of startElem. 0.5 centers it vertically within startElem
    this.leftEnd = leftEnd;
    this.topEnd = topEnd;

    this.applyOptions(options);
  }

  stepForward() {
    return new Promise(resolve => {
      if (this.updateOnEntry && AnimObject.enteringList.includes(this.animName)) {
        this.updateEndPoints();

        if (this.continuousUpdates) {
          AnimLineUpdater.setInterval(this.domElem, this.updateEndPoints.bind(this));
        }
      }

      if (AnimObject.exitingList.includes(this.animName)) {
        AnimLineUpdater.clearInterval(this.domElem);
      }

      super.stepForward()
      .then(() => resolve());
    });
  }

  stepBackward() {
    return new Promise(resolve => {
      if (this.updateOnEntry && AnimObject.enteringList.includes(`undo--${this.animName}`)) {
        this.updateEndPoints();

        if (this.continuousUpdates) {
          AnimLineUpdater.setInterval(this.domElem, this.updateEndPoints.bind(this));
        }
      }

      if (AnimObject.exitingList.includes(`undo--${this.animName}`)) {
        AnimLineUpdater.clearInterval(this.domElem);
      }

      super.stepBackward()
      .then(() => resolve());
    });
  }

  updateEndPoints() {
    // to properly place the endpoints, we need the positions of their bounding boxes
    // get the bounding rectangles for our <svg> element, starting reference element, ending reference element, our element's parent element
    const rectSVG = this.domElem.getBoundingClientRect();
    const rectStart = this.startElem.getBoundingClientRect();
    const rectEnd = this.endElem.getBoundingClientRect();
    const rectParent = this.domElem.parentElement.getBoundingClientRect();

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the <svg> element's current top and left from the offset
    // But because elements start in the Content box of their parent, which excludes the border,...
    // ...instead of the Fill area—which include the border—,our element's top and left do not account for border widths of the parent, which...
    // ... extend the bounding box of the parent. Does we need to subtract the parent's border thicknesses as well.
    const SVGLeftOffset = -rectSVG.left - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderLeftWidth);
    const SVGTopOffset = -rectSVG.top - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderTopWidth);

    // change the x and y coordinates of our <svg>'s nested <line> based on the bounding boxes of the starting and ending reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    const line = this.domElem.querySelector('.free-line__line');
    line.x1.baseVal.value = (1 - this.leftStart) * rectStart.left + (this.leftStart) * rectStart.right + SVGLeftOffset;
    line.y1.baseVal.value = (1 - this.topStart) * rectStart.top + (this.topStart) * rectStart.bottom + SVGTopOffset;
    line.x2.baseVal.value = (1 - this.leftEnd) * rectEnd.left + (this.leftEnd) * rectEnd.right + SVGLeftOffset;
    line.y2.baseVal.value = (1 - this.topEnd) * rectEnd.top + (this.topEnd) * rectEnd.bottom + SVGTopOffset;
  }

  applyOptions(options) {
    if (!options) { return; }

    super.applyOptions();
    const {
      updateOnEntry,
      continuousUpdates,
    } = options;
    this.updateOnEntry = updateOnEntry ?? this.updateOnEntry;
    this.continuousUpdates = continuousUpdates ?? this.continuousUpdates;
  }
}
