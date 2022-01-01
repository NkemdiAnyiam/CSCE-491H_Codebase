export class AnimTimeline {
  animBlocks = []; // array of every AnimBlock in this timeline
  stepNum = 0; // index into animBlocks
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  currDirection = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise

  constructor(...animBlocks) {
    this.addBlocks(animBlocks);
    this.numBlocks = this.animBlocks.length;
  }

  addBlock(animBlock) { this.animBlocks.push(animBlock); }
  addBlocks(animBlocks) { animBlocks.forEach(animBlock => this.animBlocks.push(animBlock)); }

  // plays current AnimBlock and increments stepNum
  async stepForward() {
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
    // if skipping is enabled in the middle of animating, fire the skip signal
    if (this.isSkipping && this.isAnimating) { this.fireSkipSignal(); }
    return this.isSkipping;
  }

    // tells the current AnimBlock to instantly finish its animations
  fireSkipSignal() {
    this.animBlocks[this.stepNum].fireSkipSignal();
  }
}
