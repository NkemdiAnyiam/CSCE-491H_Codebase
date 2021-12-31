class AnimTimeline {
  animBlocks = [];
  stepNum = 0;
  isSkipping = false;
  currDirection = 'forward';
  isAnimating = false;

  constructor(...animBlocks) {
    this.addBlocks(animBlocks);
    this.numBlocks = this.animBlocks.length;
  }

  addBlock(animBlock) {
    this.animBlocks.push(animBlock);
  }

  addBlocks(animBlocks) {
    animBlocks.forEach(animBlock => {
      this.animBlocks.push(animBlock);
    });
  }

  async stepForward() {
    this.isAnimating = true;
    this.currDirection = 'forward';
    if (this.isSkipping) { this.fireSkipSignal(); }
    await this.animBlocks[this.stepNum].play();
    ++this.stepNum;
    this.isAnimating = false;
    return Promise.resolve();
  }

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
    if (this.isSkipping && this.isAnimating) { this.fireSkipSignal(); }
    return this.isSkipping;
  }

  fireSkipSignal() {
    this.animBlocks[this.stepNum].fireSkipSignal();
  }
}

export default AnimTimeline;
