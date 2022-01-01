export class AnimTimeline {
  static id = 0;

  id; // used to uniquely identify this specific timeline
  animBlocks = []; // array of every AnimBlock in this timeline
  stepNum = 0; // index into animBlocks
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  currDirection = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise

  constructor(...animBlocks) {
    this.id = AnimTimeline.id++;
    
    this.addBlocks(animBlocks);
    this.numBlocks = this.animBlocks.length;
  }

  addBlock(animBlock) {
    animBlock.setID(this.id);
    this.animBlocks.push(animBlock);
  }
  addBlocks(animBlocks) { animBlocks.forEach(animBlock => this.addBlock(animBlock)); }

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
  fireSkipSignal() {
    this.animBlocks[this.stepNum].fireSkipSignal();
  }

  // sets the playbacks of all currently running animations that belong to this timeline
  fireRateSignal(rate) {
    const allAnimations = document.getAnimations();
    for (let i = 0; i < allAnimations.length; ++i) {
      // an animation "belongs" to this timeline if its id matches
      if (Number.parseInt(allAnimations[i].id) === this.id) {
        allAnimations[i].playbackRate = rate;
      }
    }
  }
}
