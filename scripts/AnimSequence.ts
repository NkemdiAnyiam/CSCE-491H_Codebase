import { AnimBlock, AnimTimelineAnimation } from "./AnimBlock.js";
import { AnimTimeline } from "./AnimTimeline.js";

type AnimSequenceOptions = {
  description: string;
  tag: string;
  continueNext: boolean; // TODO: rename to autoPlayNext
  continuePrev: boolean; // TODO: rename to autoRewindPrev
};

export class AnimSequence {
  static id = 0;
  
  id: number;
  timelineID: number = NaN; // set to match the id of the AnimTimeline to which it belongs
  parentTimeline?: AnimTimeline; // pointer to parent AnimTimeline
  description: string = '<blank sequence description>';
  tag: string = ''; // helps idenfity current AnimSequence for using AnimTimeline's skipTo()
  animBlocks: AnimBlock[] = []; // array of animBlocks
  options: AnimSequenceOptions;

  constructor(animBlocks: AnimBlock[] | null = null, options: Partial<AnimSequenceOptions> = {}) {
    this.id = AnimSequence.id++;

    if (animBlocks) {
      this.addBlocks(...animBlocks);
    }

    this.options = {
      description: '',
      tag: '',
      continueNext: false, // decides whether the next AnimSequence should automatically play after this one
      continuePrev: false, // decides if the prev AnimSequence should automatically play after this one

      // user options take priority
      ...options,
    };
  }

  getDescription() { return this.description; }
  getTag() { return this.tag; }
  
  setDescription(description: string) { this.description = description; }
  setTag(tag: string) { this.tag = tag; }
  setID(id: number) {
    this.timelineID = id;
    for (const animBlock of this.animBlocks) {
      animBlock.setID(this.id, this.timelineID);
      animBlock.parentTimeline = this.parentTimeline;
      animBlock.parentSequence = this;
    }
  }

  addBlocks(...animBlocks: AnimBlock[]): void {
    // CHANGE NOTE: removed addOneBlock()
    this.animBlocks.push(...animBlocks);
  }

  // plays each animBlock contained in this AnimSequence instance in sequential order
  // TODO: Overhaul current sequencing structure to make timing more intuitive (and fix some catastrophic edge cases)
  async play(): Promise<boolean> {
    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;
    let parallelBlocks: Promise<void>[] = [];
    for (let i = 0; i < numBlocks; ++i) {
      const currAnimBlock = animBlocks[i];
      const prevAnimBlock = animBlocks[i - 1];
      if (i === 0 || prevAnimBlock?.blocksNext === false) {
        parallelBlocks.push(currAnimBlock.stepForward());
      }
      else {
        await Promise.all(parallelBlocks);
        parallelBlocks = [currAnimBlock.stepForward()];
      }


      // // if the current animBlock blocks the next animBlock, we need to await the completion (this is intuitive)
      // if (i === numBlocks - 1 || currAnimBlock.getBlocksNext())
      //   { await currAnimBlock.stepForward(); }
      // else
      //   { currAnimBlock.stepForward(); }
    }

    await Promise.all(parallelBlocks);

    return this.options.continueNext;
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind(): Promise<boolean> {
    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;
    let parallelBlocks: Promise<void>[] = [];
    for (let i = numBlocks - 1; i >= 0; --i) {
      const currAnimBlock = animBlocks[i];
      const nextAnimBlock = animBlocks[i + 1];
      if (i === numBlocks - 1 || nextAnimBlock?.blocksPrev === false) {
        parallelBlocks.push(currAnimBlock.stepBackward());
      }
      else {
        await Promise.all(parallelBlocks);
        parallelBlocks = [currAnimBlock.stepBackward()];
      }


      // if (i === 0 || currAnimBlock.getBlocksPrev())
      //   { await currAnimBlock.stepBackward(); }
      // else
      //   { currAnimBlock.stepBackward(); }
    }

    await Promise.all(parallelBlocks);

    return this.options.continuePrev;
  }

  commit(): void {
    let maxFinishTime = 0;
    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;

    for (let i = 0; i < numBlocks; ++i) {
      const currAnimBlock = animBlocks[i];
      const prevBlock = animBlocks[i-1];
      const currStartTime = animBlocks[i-1]?.blocksNext ? prevBlock?.startTime ?? 0 : maxFinishTime;

      currAnimBlock.startTime = currStartTime + currAnimBlock.delay;
      currAnimBlock.finishTime = currAnimBlock.startTime + +currAnimBlock.duration;

      maxFinishTime = Math.max(currAnimBlock.finishTime + currAnimBlock.endDelay, maxFinishTime);

      const comparator = function(funcA: Function, funcB: Function): -1 | 1 {
        return funcA.time <= funcB.time ? -1 : 1;
      };

      this.funcs.sort(comparator);
    }
  }

  // used to skip currently running animation so they don't run at regular speed while using skipping
  skipCurrentAnimations(): void {
    // get all currently running animations (if animations are currently running, we need to force them to finish)
    const allAnimations = document.getAnimations() as AnimTimelineAnimation[];
    const numAnimations = allAnimations.length;
    // an animation "belongs" to this sequence if its sequence id matches
    for (let i = 0; i < numAnimations; ++i) {
      // an animation "belongs" to this sequence if its ids match
      if (allAnimations[i].sequenceID === this.id) { allAnimations[i].finish(); }
    }
  }
}
