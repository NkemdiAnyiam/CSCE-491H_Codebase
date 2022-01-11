import { AnimBlock } from "./AnimBlock.js";
import { AnimBlockLine } from "./AnimBlockLine.js";

export class AnimSequence {
  timelineID; // set to match the id of the AnimTimeline to which it belongs
  animBlocks = []; // array of animBlocks

  constructor(animBlocks = null, options = null) {
    if (animBlocks) {
      if (animBlocks instanceof Array
        && (animBlocks[0] instanceof Array || animBlocks[0] instanceof Array)) { this.addManyBlocks(animBlocks); }
      else { this.addOneBlock(animBlocks); }
    }
  }

  addOneBlock(animBlock) {
    if (animBlock instanceof AnimBlock) { this.animBlocks.push(animBlock); }
    else {
      const [type, ...animBlockParams] = animBlock;
      if (type === 'std') { this.addOneBlock(new AnimBlock(...animBlockParams)); return; }
      if (type === 'line') { this.addOneBlock(new AnimBlockLine(...animBlockParams)); return; }
      console.error('animBlock type not specified'); // TODO: throw error
    }
  }

  addManyBlocks(animBlocks) {
    animBlocks.forEach(animBlock => this.addOneBlock(animBlock));
  }

  // plays each animBlock contained in this AnimSequence instance in Sequenceuential order
  async play() {
    for (let i = 0; i < this.animBlocks.length; ++i) {
      // if the current animBlock blocks the next animBlock, we need to await the completion (this is intuitive)
      if (this.animBlocks[i].getBlocksNext()) { await this.animBlocks[i].stepForward(); }
      else { this.animBlocks[i].stepForward(); }
    }

    return Promise.resolve();
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind() {
    for (let i = this.animBlocks.length - 1; i >= 0; --i) {
      if (this.animBlocks[i].getBlocksPrev()) { await this.animBlocks[i].stepBackward(); }
      else { this.animBlocks[i].stepBackward(); }
    }

    return Promise.resolve();
  }

  // tells every animBlock here to briefly allow instantaneous animation
  fireSkipSignal() {
    this.animBlocks.forEach(animBlock => animBlock.handleSkipSignal());
  }

  setID(id) {
    this.timelineID = id;
    this.animBlocks.forEach(animBlock => animBlock.setID(this.timelineID));
  }
}
