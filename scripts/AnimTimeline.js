class AnimTimeline {
  animBlocks = [];
  stepNum = 0;

  constructor(...animBlocks) {
    this.addBlocks(animBlocks);
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
    await this.animBlocks[this.stepNum].play();
    ++this.stepNum;
    return Promise.resolve();
  }

  async stepBackward() {
    --this.stepNum;
    await this.animBlocks[this.stepNum].rewind();
    return Promise.resolve();
  }
}

export default AnimTimeline;
