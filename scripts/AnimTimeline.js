import { AnimSequence } from "./AnimSequence.js";

export class AnimTimeline {
  static id = 0;

  id; // used to uniquely identify this specific timeline
  animSequences = []; // array of every AnimSequence in this timeline
  numSequences = 0;
  nextSeqIndex = 0; // index into animSequences
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  isPaused = false;
  currDirection = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise
  usingSkipTo = false; // true if currently using skipTo()
  playbackRate = 1;

  constructor(animSequences = null, options = null) {
    this.id = AnimTimeline.id++;

    if (animSequences) {
      // [AnimSequence] OR [[]]
      if (animSequences instanceof Array && (animSequences[0] instanceof AnimSequence || animSequences[0] instanceof Array)) {
        this.addSequences(animSequences);
      }
      else {
        this.addOneSequence(animSequences);
      }
    }

    this.debugMode = options ? (options?.debugMode ?? false) : false;
  }

  addOneSequence(animSequenceOrData) {
    if (animSequenceOrData instanceof AnimSequence) {
      animSequenceOrData.parentTimeline = this;
      animSequenceOrData.setID(this.id);
      this.animSequences.push(animSequenceOrData);
    }
    else {
      const newAnimSequence = new AnimSequence();
      if (animSequenceOrData[0] instanceof Array) { newAnimSequence.addManyBlocks(animSequenceOrData); }
      else { newAnimSequence.addOneBlock(animSequenceOrData); }
      newAnimSequence.parentTimeline = this;
      newAnimSequence.setID(this.id);
      this.animSequences.push(newAnimSequence);
    }
    ++this.numSequences;
  }

  addManySequences(animSequences) {
    animSequences.forEach(animSequence => this.addOneSequence(animSequence));
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    this.updateCurrentAnimationsRates(rate);
  }
  getPlaybackRate() { return this.playbackRate; }

  getCurrDirection() { return this.currDirection; }
  getIsStepping() { return this.isStepping; }
  getIsPaused() { return this.isPaused; }

  // steps forward or backward and does error-checking
  async step(direction) {
    if (this.isPaused) { return Promise.reject('Cannot step while playback is paused'); }
    if (this.isStepping) { return Promise.reject('Cannot step while already animating'); }
    this.isStepping = true;

    let continueOn;
    if (direction === 'forward') {
      // reject promise if trying to step forward at the end of the timeline
      if (this.atEnd()) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepForward() at end of timeline')}); }
      do {continueOn = await this.stepForward();} while(continueOn);
    }
    else if (direction === 'backward') {
      // reject promise if trying to step backward at the beginning of the timeline
      if (this.atBeginning()) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepBackward() at beginning of timeline')}); }
      do {continueOn = await this.stepBackward();} while(continueOn);
    }
    else { throw new Error(`Error: Invalid step direction '${direction}'. Must be 'forward' or 'backward'`); }

    return new Promise(resolve => {
      this.isStepping = false;
      resolve(direction);
    });
  }

  atBeginning() { return this.nextSeqIndex === 0; }
  atEnd() { return this.nextSeqIndex === this.numSequences; }

  // plays current AnimSequence and increments nextSeqIndex
  stepForward() {
    this.currDirection = 'forward';

    if (this.debugMode) { console.log(`-->> ${this.nextSeqIndex}: ${this.animSequences[this.nextSeqIndex].getDescription()}`); }

    if (this.isSkipping || this.usingSkipTo) { this.skipCurrentAnimations(); }

    return new Promise(resolve => {
      this.animSequences[this.nextSeqIndex].play() // wait for the current AnimSequence to finish all of its animations
      .then(continueNext => {
        ++this.nextSeqIndex;
        resolve(continueNext && !this.atEnd());
      });
    });
  }

  // decrements nextSeqIndex and rewinds the AnimSequence
  stepBackward() {
    --this.nextSeqIndex;
    this.currDirection = 'backward';

    if (this.debugMode) { console.log(`<<-- ${this.nextSeqIndex}: ${this.animSequences[this.nextSeqIndex].getDescription()}`); }

    if (this.isSkipping || this.usingSkipTo) { this.skipCurrentAnimations(); }

    return new Promise(resolve => {
      this.animSequences[this.nextSeqIndex].rewind()
      .then(continuePrev => {
        resolve(continuePrev && !this.atBeginning());
      });
    });
  }

  // immediately skips to first AnimSequence in animSequences with matching tag field
  async skipTo(tag, offset = 0) {
    if (this.isStepping) { return Promise.reject('Cannot use skipTo() while currently animating'); }
    // Calls to skipTo() must be separated using await or something that similarly prevents simultaneous execution of code
    if (this.usingSkipTo) { return Promise.reject('Do not perform simultaneous calls to skipTo() in timeline'); }
    if (!Number.isSafeInteger(offset)) { throw new Error(`Error: invalid offset "${offset}". Value must be an integer.`); }

    // get nextSeqIndex corresponding to matching AnimSequence
    const tagIndex = this.animSequences.findIndex(animSequence => animSequence.getTag() === tag) + offset;
    if (tagIndex - offset === -1) { return Promise.reject(`Tag name "${tag}" not found`); }
    if (tagIndex < 0 || tagIndex  > this.numSequences)
      { throw new Error(`Error: skipping to tag "${tag}" with offset "${offset}" goes out of timeline bounds`); }

    this.usingSkipTo = true;
    this.wasPaused = this.isPaused; // if paused, then unpause to perform the skipping; then pause
    // keep skipping forwards or backwards depending on direction of nextSeqIndex
    if (this.wasPaused) { this.togglePause(); }
    if (this.nextSeqIndex <= tagIndex)
      { while (this.nextSeqIndex < tagIndex) { await this.stepForward(); } } // <= to play the sequence as well
    else
      { while (this.nextSeqIndex > tagIndex) { await this.stepBackward(); } } // +1 to ensure the sequence isn't undone
    if (this.wasPaused) { this.togglePause(); }

    return new Promise(resolve => {
      this.usingSkipTo = false;
      resolve(tag);
    });
  }

  toggleSkipping(isSkipping) {
    this.isSkipping = isSkipping ?? !this.isSkipping;
    // if skipping is enabled in the middle of animating, force currently running AnimSequence to finish
    if (this.isSkipping && this.isStepping && !this.isPaused) { this.skipCurrentAnimations(); }
    return this.isSkipping;
  }

  // tells the current AnimSequence to instantly finish its animations
  skipCurrentAnimations() { this.animSequences[this.nextSeqIndex].skipCurrentAnimations(); }

  // used to set playback rate of currently running animations so that they don't unintuitively run at regular speed
  updateCurrentAnimationsRates(rate) {
    this.doForCurrentAnimations((animation) => animation.playbackRate = rate);
  }

  // pauses or unpauses playback
  togglePause(isPaused) {
    this.isPaused = isPaused ?? !this.isPaused;
    if (this.isPaused) {
      this.doForCurrentAnimations((animation) => animation.pause());
      this.isPaused = true;
    }
    else {
      this.doForCurrentAnimations((animation) => animation.play());
      if (this.isSkipping) { this.skipCurrentAnimations(); }
      this.isPaused = false;
    }
    return this.isPaused;
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  doForCurrentAnimations(operation) {
    // get all currently running animations
    const allAnimations = document.getAnimations();
    // an animation "belongs" to this timeline if its timeline id matches
    for (let i = 0; i < allAnimations.length; ++i) {
      if (Number.parseInt(allAnimations[i].timelineID) === this.id) { operation(allAnimations[i]); }
    }
  }
}
