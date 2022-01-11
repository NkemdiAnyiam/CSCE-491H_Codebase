import { AnimObject } from "./AnimObject.js";
import { AnimLine } from "./AnimLine.js";

export class AnimBlock {
  timelineID; // set to match the id of the AnimTimeline to which it belongs
  animObjects = []; // array of AnimObjects

  constructor(animObjects = null, options = null) {
    if (animObjects) {
      if (animObjects instanceof Array
        && (animObjects[0] instanceof Array || animObjects[0] instanceof Array)) { this.addManyObjects(animObjects); }
      else { this.addOneObject(animObjects); }
    }
  }

  addOneObject(animObject) {
    if (animObject instanceof AnimObject) { this.animObjects.push(animObject); }
    else {
      const [type, ...animObjectParams] = animObject;
      if (type === "object") { this.addOneObject(new AnimObject(...animObjectParams)); return; }
      if (type === 'line') { this.addOneObject(new AnimLine(...animObjectParams)); return; }
      console.error('AnimObject type not specified'); // TODO: throw error
    }
  }

  addManyObjects(animObjects) {
    animObjects.forEach(animObject => this.addOneObject(animObject));
  }

  // plays each AnimObject contained in this AnimBlock instance in sequential order
  async play() {
    for (let i = 0; i < this.animObjects.length; ++i) {
      // if the current AnimObject blocks the next AnimObject, we need to await the completion (this is intuitive)
      if (this.animObjects[i].getBlocksNext()) { await this.animObjects[i].stepForward(); }
      else { this.animObjects[i].stepForward(); }
    }

    return Promise.resolve();
  }

  // rewinds each AnimObject contained in this AnimBlock instance in reverse order
  async rewind() {
    for (let i = this.animObjects.length - 1; i >= 0; --i) {
      if (this.animObjects[i].getBlocksPrev()) { await this.animObjects[i].stepBackward(); }
      else { this.animObjects[i].stepBackward(); }
    }

    return Promise.resolve();
  }

  // tells every AnimObject here to briefly allow instantaneous animation
  fireSkipSignal() {
    this.animObjects.forEach(animObject => animObject.handleSkipSignal());
  }

  setID(id) {
    this.timelineID = id;
    this.animObjects.forEach(animObject => animObject.setID(this.timelineID));
  }
}
