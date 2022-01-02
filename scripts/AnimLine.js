import { AnimObject } from "./AnimObject.js";
import { AnimLineUpdater } from "./AnimLineUpdater.js";

export class AnimLine extends AnimObject {
  // the defaults of both updateEndpointsOnEntry and trackEndpoints can be replaced in applyOptions()
  updateEndpointsOnEntry = true; // determines whether or not to call updateEndpoints() upon using an entering animation
  trackEndpoints = true; // determines whether or not to continuously periodically called updateEndpoints() while visible

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
      this.handleUpdateSettings(this.animName);

      super.stepForward()
      .then(() => resolve());
    });
  }

  stepBackward() {
    return new Promise(resolve => {
      this.handleUpdateSettings(this.undoAnimName);

      super.stepBackward()
      .then(() => resolve());
    });
  }

  handleUpdateSettings(animName) {
    if (this.updateEndpointsOnEntry && AnimObject.isEntering(animName)) {
      this.updateEndpoints();

      // if continuous tracking is enabled, tell AnimLineUpdater to set an interval for updateEndpoints()
      if (this.trackEndpoints) { AnimLineUpdater.setInterval(this.domElem, this.updateEndpoints.bind(this)); }
    }

    // if we are exiting, turn off the interval for updateEndPoints()
    if (AnimObject.isExiting(animName)) { AnimLineUpdater.clearInterval(this.domElem); }
  }

  updateEndpoints() {
    // to properly place the endpoints, we need the positions of their bounding boxes
    // get the bounding rectangles for starting reference element, ending reference element, and parent element
    const rectStart = this.startElem.getBoundingClientRect();
    const rectEnd = this.endElem.getBoundingClientRect();
    const rectParent = this.domElem.parentElement.getBoundingClientRect();

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the parent element's current top and left from the offset
    // But because elements start in their parent's Content box—which excludes the border—...
    // ...instead of the Fill area—which includes the border—,our element's top and left are offset by the parent element's border width...
    // ... with respect to the actual bounding box of the parent. Therefore, we must subtract the parent's border thicknesses as well.
    const SVGLeftOffset = -rectParent.left - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderLeftWidth);
    const SVGTopOffset = -rectParent.top - Number.parseFloat(getComputedStyle(this.domElem.parentElement).borderTopWidth);

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

    const {lineOptions} = options;
    if (lineOptions) { this.applyLineOptions(lineOptions); }
  }

  applyLineOptions(lineOptions) {
    const {
      updateEndpointsOnEntry,
      trackEndpoints,
    } = lineOptions;
    this.updateEndpointsOnEntry = updateEndpointsOnEntry ?? this.updateEndpointsOnEntry;
    this.trackEndpoints = trackEndpoints ?? this.trackEndpoints;
  }
}
