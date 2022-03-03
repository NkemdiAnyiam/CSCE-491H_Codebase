import { AnimSequence } from "./AnimSequence.js";

export class AnimTimeline {
  static id = 0;

  id; // used to uniquely identify this specific timeline
  animSequences = []; // array of every AnimSequence in this timeline
  numSequences = 0;
  stepNum = 0; // index into animSequences
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  isPaused = false;
  currDirection = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise
  usingSkipTo = false; // true if currently using skipTo()
  playbackRate = {value: 1};

  constructor(animSequences = null, options = null) {
    this.id = AnimTimeline.id++;

    if (animSequences) {
      // [AnimSequence] OR [[]]
      if (animSequences instanceof Array && (animSequences[0] instanceof AnimSequence || animSequences[0] instanceof Array)) {
        this.addSequences(animSequences);
        this.numSequences = this.animSequences.length;
      }
      else {
        this.addSequence(animSequences);
        this.numSequences = 1;
      }
    }

    this.debugMode = options ? (options?.debugMode ?? false) : false;

    this.step = this.step.bind(this);
    this.getForwardStepper = this.getForwardStepper.bind(this);
    this.getBackwardStepper = this.getBackwardStepper.bind(this);
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
    this.playbackRate.value = rate;
    this.updateCurrentAnimationsRates(rate);
  }
  getPlaybackRate() { return this.playbackRate.value; }

  getForwardStepper() { return () => this.step('forward'); }
  getBackwardStepper() { return () => this.step('backward'); }

  // steps forward or backward and does error-checking
  async step(direction) {
    if (this.isStepping) { return Promise.reject('Cannot step while already animating'); }
    if (this.isPaused) { return Promise.reject('Cannot step while isPaused'); }
    this.isStepping = true;

    let continueOn;
    if (direction === 'forward') {
      // reject promise if trying to step forward at the end of the timeline
      if (this.atEnd()) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepForward() at end of timeline')}); }
      // if using skipTo(), ignore an AnimSequence request to automatically play the upcoming sequence
      if (this.usingSkipTo) { await this.stepForward(); }
      else { do {continueOn = await this.stepForward();} while(continueOn); }
    }
    else if (direction === 'backward') {
      // reject promise if trying to step backward at the beginning of the timeline
      if (this.atBeginning()) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepBackward() at beginning of timeline')}); }
      if (this.usingSkipTo) { await this.stepBackward(); }
      else { do {continueOn = await this.stepBackward();} while(continueOn); }
    }
    else { return Promise.reject(`Error: Invalid step direction '${direction}'. Must be 'forward' or 'backward'`); }

    return new Promise(resolve => {
      this.isStepping = false;
      resolve(direction);
    });
  }

  atBeginning() { return this.stepNum === 0; }
  atEnd() { return this.stepNum === this.numSequences; }

  // plays current AnimSequence and increments stepNum
  stepForward() {
    this.currDirection = 'forward';

    if (this.debugMode) { console.log(`-->> ${this.animSequences[this.stepNum].getDescription()}`); }

    if (this.isSkipping || this.usingSkipTo) { this.skipCurrentAnimations(); }

    return new Promise(resolve => {
      this.animSequences[this.stepNum].play() // wait for the current AnimSequence to finish all of its animations
      .then((continueNext) => {
        ++this.stepNum;
        resolve(continueNext && !this.atEnd());
      });
    });
  }

  // decrements stepNum and rewinds the AnimSequence
  stepBackward() {
    --this.stepNum;
    this.currDirection = 'backward';

    if (this.debugMode) { console.log(`<<-- ${this.animSequences[this.stepNum].getDescription()}`); }

    if (this.isSkipping || this.usingSkipTo) { this.skipCurrentAnimations(); }

    return new Promise(resolve => {
      this.animSequences[this.stepNum].rewind()
      .then((continuePrev) => {
        resolve(continuePrev && !this.atBeginning());
      });
    });
  }

  // immediately skips to first AnimSequence in animSequences with matching tag field
  async skipTo(tag) {
    // Calls to skipTo() must be separated using await or something that similarly prevents simultaneous execution of code
    if (this.usingSkipTo) { return Promise.reject('Do not perform simultaneous calls to skipTo() in timeline'); }
    this.usingSkipTo = true;

    // get stepNum corresponding to matching AnimSequence
    const stepNumTo = this.animSequences.findIndex(animSequence => animSequence.getTag() === tag);
    if (stepNumTo === -1) { return Promise.reject('Tag name not found'); }

    // keep skipping forwards or backwards depending on direction of stepNum
    if (this.stepNum < stepNumTo)
      { while (this.stepNum < stepNumTo) { await this.step('forward'); } }
    else
      { while (this.stepNum > stepNumTo) { await this.step('backward'); } }

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
  skipCurrentAnimations() { this.animSequences[this.stepNum].skipCurrentAnimations(); }

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
