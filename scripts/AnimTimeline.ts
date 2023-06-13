import { AnimTimelineAnimation } from "./AnimBlock.js";
import { AnimSequence } from "./AnimSequence.js";

type AnimTimelineOptions = {
  debugMode: boolean;
};

export class AnimTimeline {
  static id = 0;

  id; // used to uniquely identify this specific timeline
  animSequences: AnimSequence[] = []; // array of every AnimSequence in this timeline
  nextSeqIndex = 0; // index into animSequences
  isStepping = false;
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  isPaused = false;
  currDirection = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise
  usingSkipTo = false; // true if currently using skipTo()
  playbackRate = 1;
  options: AnimTimelineOptions;

  get numSequences() { return this.animSequences.length; }

  constructor(animSequences: AnimSequence[] | AnimSequence | null = null, options: Partial<AnimTimelineOptions> = {}) {
    this.id = AnimTimeline.id++;

    if (animSequences) {
      if (animSequences instanceof Array) {
        this.addManySequences(animSequences);
      }
      else {
        this.addOneSequence(animSequences);
      }
    }

    this.options = {
      debugMode: false,
      ...options,
    };
  }

  addOneSequence(animSequence: AnimSequence) {
      animSequence.parentTimeline = this;
      animSequence.setID(this.id);
      this.animSequences.push(animSequence);
  }

  addManySequences(animSequences: AnimSequence[]) {
    animSequences.forEach(animSequence => this.addOneSequence(animSequence));
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    this.updateCurrentAnimationsRates(rate);
  }
  getPlaybackRate() { return this.playbackRate; }

  getCurrDirection() { return this.currDirection; }
  getIsStepping() { return this.isStepping; }
  getIsPaused() { return this.isPaused; }

  // steps forward or backward and does error-checking
  async step(direction: 'forward' | 'backward') {
    if (this.isPaused) { return Promise.reject('Cannot step while playback is paused'); }
    if (this.isStepping) { return Promise.reject('Cannot step while already animating'); }
    this.isStepping = true;

    let continueOn;
    switch(direction) {
      case 'forward':
        // reject promise if trying to step forward at the end of the timeline
        if (this.atEnd()) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepForward() at end of timeline')}); }
        do {continueOn = await this.stepForward();} while(continueOn);
        break;

      case 'backward':
        // reject promise if trying to step backward at the beginning of the timeline
        if (this.atBeginning()) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepBackward() at beginning of timeline')}); }
        do {continueOn = await this.stepBackward();} while(continueOn);
        break;

      default:
        throw new Error(`Error: Invalid step direction '${direction}'. Must be 'forward' or 'backward'`);
    }

    // TODO: Potentially rewrite async/await syntax
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

    if (this.options.debugMode) { console.log(`-->> ${this.nextSeqIndex}: ${this.animSequences[this.nextSeqIndex].getDescription()}`); }

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

    if (this.options.debugMode) { console.log(`<<-- ${this.nextSeqIndex}: ${this.animSequences[this.nextSeqIndex].getDescription()}`); }

    return new Promise(resolve => {
      this.animSequences[this.nextSeqIndex].rewind()
      .then(continuePrev => {
        resolve(continuePrev && !this.atBeginning());
      });
    });
  }

  // immediately skips to first AnimSequence in animSequences with matching tag field
  async skipTo(tag: string, offset: number = 0) {
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
    let wasPaused = this.isPaused; // if paused, then unpause to perform the skipping; then pause
    // keep skipping forwards or backwards depending on direction of nextSeqIndex
    if (wasPaused) { this.togglePause(); }
    if (this.nextSeqIndex <= tagIndex)
      { while (this.nextSeqIndex < tagIndex) { await this.stepForward(); } } // could be <= to play the sequence as well
    else
      { while (this.nextSeqIndex > tagIndex) { await this.stepBackward(); } } // could be tagIndex+1 to prevent the sequence from being undone
    if (wasPaused) { this.togglePause(); }

    return new Promise(resolve => {
      this.usingSkipTo = false;
      resolve(tag);
    });
  }

  toggleSkipping(isSkipping?: boolean) {
    this.isSkipping = isSkipping ?? !this.isSkipping;
    // if skipping is enabled in the middle of animating, force currently running AnimSequence to finish
    if (this.isSkipping && this.isStepping && !this.isPaused) { this.skipCurrentAnimations(); }
    return this.isSkipping;
  }

  // tells the current AnimSequence to instantly finish its animations
  skipCurrentAnimations() { this.animSequences[this.nextSeqIndex].skipCurrentAnimations(); }

  // used to set playback rate of currently running animations so that they don't unintuitively run at regular speed
  updateCurrentAnimationsRates(rate: number) {
    this.doForCurrentAnimations((animation: Animation) => animation.playbackRate = rate);
  }

  // pauses or unpauses playback
  togglePause(isPaused?: boolean) {
    this.isPaused = isPaused ?? !this.isPaused;
    if (this.isPaused) {
      this.doForCurrentAnimations((animation: Animation) => animation.pause());
    }
    else {
      this.doForCurrentAnimations((animation: Animation) => animation.play());
      if (this.isSkipping) { this.skipCurrentAnimations(); }
    }
    return this.isPaused;
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  doForCurrentAnimations(operation: (animation: Animation) => void) {
    // get all currently running animations
    const allAnimations = document.getAnimations() as AnimTimelineAnimation[];
    // an animation "belongs" to this timeline if its timeline id matches
    for (let i = 0; i < allAnimations.length; ++i) {
      if (allAnimations[i].timelineID === this.id) { operation(allAnimations[i]); }
    }
  }
}
