import { AnimBlock } from "./AnimBlock.js";

export class AnimTimeline {
  static id = 0;

  id; // used to uniquely identify this specific timeline
  animBlocks = []; // array of every AnimBlock in this timeline
  numBlocks = 0;
  stepNum = 0; // index into animBlocks
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  currDirection = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise

  constructor(animBlocks = null, options = null) {
    this.id = AnimTimeline.id++;

    if (animBlocks) {
      if (animBlocks instanceof Array && (animBlocks[0] instanceof AnimBlock || animBlocks[0] instanceof Array)) {
        this.addBlocks(animBlocks);
        this.numBlocks = this.animBlocks.length;
      }
      else {
        this.addBlock(animBlocks);
        this.numBlocks = 1;
      }
    }
  }

  addOneBlock(animBlockOrData) {
    if (animBlockOrData instanceof AnimBlock) {
      animBlockOrData.setID(this.id);
      this.animBlocks.push(animBlockOrData);
    }
    else {
      const newAnimBlock = new AnimBlock();
      if (animBlockOrData[0] instanceof Array) { newAnimBlock.addManyObjects(animBlockOrData); }
      else { newAnimBlock.addOneObject(animBlockOrData); }
      newAnimBlock.setID(this.id);
      this.animBlocks.push(newAnimBlock);
    }
    ++this.numBlocks;
  }

  addManyBlocks(animBlocks) {
    animBlocks.forEach(animBlock => this.addOneBlock(animBlock));
  }

  // plays current AnimBlock and increments stepNum
  async stepForward() {
    if (this.isAnimating) { return Promise.reject('Cannot stepForward() while already animating'); }
    if (this.atEnd()) { return Promise.reject('Cannot stepForward() at end of timeline'); }

    this.isAnimating = true;
    this.currDirection = 'forward';
    if (this.isSkipping) { this.fireSkipSignal(); }
    await this.animBlocks[this.stepNum].play(); // wait for the current AnimBlock to finish all of its animations
    ++this.stepNum;
    this.isAnimating = false;
    return Promise.resolve();
  }

  // decrements stepNum and rewinds the AnimBlock
  async stepBackward() {
    if (this.isAnimating) { return Promise.reject('Cannot stepBackward() while already animating'); }
    if (this.atBeginning()) { return Promise.reject('Cannot stepBackward() at beginning of timeline'); }

    this.isAnimating = true;
    --this.stepNum;
    this.currDirection = 'backward';
    if (this.isSkipping) { this.fireSkipSignal(); }
    await this.animBlocks[this.stepNum].rewind();
    this.isAnimating = false;
    return Promise.resolve();
  }

  toggleSkipping(isSkipping) {
    this.isSkipping = isSkipping ?? !this.isSkipping;
    if (this.isSkipping) {
      // if skipping is enabled in the middle of animating, force currently running AnimBlock to finish
      if (this.isAnimating) {
        this.fireSkipSignal();
        // the animation(s) actually running right now won't handle the skip signal, so maximize playback rate to force near instant completion instead
        this.fireRateSignal(Number.MAX_SAFE_INTEGER);
      }
    }
    return this.isSkipping;
  }

    // tells the current AnimBlock to instantly finish its animations
  fireSkipSignal() { this.animBlocks[this.stepNum].fireSkipSignal(); }

  // sets the playbacks of all currently running animations that belong to this timeline
  fireRateSignal(rate) {
    const allAnimations = document.getAnimations();
    for (let i = 0; i < allAnimations.length; ++i) {
      // an animation "belongs" to this timeline if its id matches
      if (Number.parseInt(allAnimations[i].id) === this.id) { allAnimations[i].playbackRate = rate; }
    }
  }

  atBeginning() { return this.stepNum === 0; }
  atEnd() { return this.stepNum === this.numBlocks; }
}
