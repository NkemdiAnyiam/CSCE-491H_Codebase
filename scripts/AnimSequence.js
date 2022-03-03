import { AnimBlock } from "./AnimBlock.js";
import { AnimBlockLine } from "./AnimBlockLine.js";

export class AnimSequence {
  static id = 0;

  timelineID; // set to match the id of the AnimTimeline to which it belongs
  parentTimeline; // pointer to parent AnimTimeline
  description = '<blank sequence description>';
  tag = ''; // helps idenfity current AnimSequence for using AnimTimeline's skipTo()
  animBlocks = []; // array of animBlocks

  constructor(animBlocks = null, options = null) {
    this.id = AnimSequence.id++;

    if (animBlocks) {
      if (animBlocks instanceof Array
        && (animBlocks[0] instanceof Array || animBlocks[0] instanceof Array)) { this.addManyBlocks(animBlocks); }
      else { this.addOneBlock(animBlocks); }
    }

    if (options) {
      this.description = options.description ?? this.description;
      this.tag = options.tag ?? this.tag;
      this.continueNext = options.continueNext; // determines whether or not the next AnimSequence should automatically play after this one
      this.continuePrev = options.continuePrev; // determines whether or not the previous AnimSequence should automatically play after this one
    }
  }

  getDescription() { return this.description; }
  getTag() { return this.tag; }
  shouldContinueF() { return this.continueNext; }
  shouldContinueB() { return this.continuePrev; }
  
  setDescription(description) { this.description = description; }
  setTag(tag) { this.tag = tag; }
  setID(id) {
    this.timelineID = id;
    this.animBlocks.forEach(animBlock => {
      animBlock.setID(this.id, this.timelineID);
      animBlock.parentTimeline = this.parentTimeline;
      animBlock.parentSequence = this;
    });
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
      if (i === this.animBlocks.length - 1 || this.animBlocks[i].getBlocksNext()) { await this.animBlocks[i].stepForward(); }
      else { this.animBlocks[i].stepForward(); }
    }

    return Promise.resolve(this.continueNext);
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind() {
    for (let i = this.animBlocks.length - 1; i >= 0; --i) {
      if (i === 0 || this.animBlocks[i].getBlocksPrev()) { await this.animBlocks[i].stepBackward(); }
      else { this.animBlocks[i].stepBackward(); }
    }

    return Promise.resolve(this.continuePrev);
  }

  // used to skip currently running animation so that they don't run at regular speed while using skipping
  skipCurrentAnimations() {
    // get all currently running animations (if animations are curretnly running, we need to force them to finish)
    const allAnimations = document.getAnimations();
    // an animation "belongs" to this sequence if its sequence id matches
    for (let i = 0; i < allAnimations.length; ++i) {
      // an animation "belongs" to this sequence if its ids match
      if (Number.parseInt(allAnimations[i].timelineID) === this.timelineID && Number.parseInt(allAnimations[i].sequenceID) === this.id) { allAnimations[i].finish(); }
    }
  }

  printDesc() {
    console.log(this.description);
  }
}
