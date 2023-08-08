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

  private animBlockGroupings_activeFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_endDelayFinishOrder: AnimBlock[][] = [];

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
    this.commit();
    const activeGroupings = this.animBlockGroupings_activeFinishOrder;
    const endDelayGroupings = this.animBlockGroupings_endDelayFinishOrder;
    const totalLength = activeGroupings.length;

    for (let i = 0; i < totalLength; ++i) {
      const activeGrouping = activeGroupings[i];
      const endDelayGrouping = endDelayGroupings[i];
      const groupingLength = activeGrouping.length;

      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].animation.awaitActiveForefinisher(activeGrouping[j-1].animation.forwardFinishes.activePeriod);
        endDelayGrouping[j].animation.awaitEndDelayForefinisher(endDelayGrouping[j-1].animation.forwardFinishes.endDelayPeriod);
      }
    }

    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;
    let parallelBlocks: Promise<void>[] = [];
    for (let i = 0; i < numBlocks; ++i) {
      const currAnimBlock = animBlocks[i];
      const prevAnimBlock = animBlocks[i - 1];
      if (i === 0 || prevAnimBlock?.blocksNext === false) {
        if (prevAnimBlock) {
          await prevAnimBlock.animation.forwardFinishes.delayPeriod;
        }
        
        // const nextBlock = animBlocks[i + 1];
        // if (nextBlock && nextBlock.activeFinishTime < currAnimBlock.activeFinishTime)
        //   { currAnimBlock.adjecentForefinishers.push(nextBlock.animation.forwardFinishes.activePeriod); }
        // else if (nextBlock)
        //   { nextBlock.adjecentForefinishers.push(currAnimBlock.animation.forwardFinishes.activePeriod); }
          
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



    // const groupings = this.animBlockGroupings_finishOrder;
    // const numGroupings = groupings.length;
    // for (let i = numGroupings - 1; i >= 0; --i) {
    //   const currGrouping = groupings[i];
    //   const currGroupingLength = currGrouping.length;
    //   for (let j = currGroupingLength - 1; j >= 0; --j) {
    //     const currAnimBlock = currGrouping[j];
    //     const prevAnimBlock = currGrouping[j - 1];
    //     const nextAnimBlock = currGrouping[j + 1];

    //     if (nextAnimBlock) {
    //       const trueFinishTime = currAnimBlock.activeFinishTime + currAnimBlock.endDelay;
    //       const otherTrueStartTime = nextAnimBlock.activeStartTime - nextAnimBlock.delay;
    //       if (trueFinishTime > otherTrueStartTime) {
    //         const otherTrueFinishTime = nextAnimBlock.activeFinishTime + nextAnimBlock.endDelay;
    //         await nextAnimBlock.animation.awaitTime(otherTrueFinishTime - trueFinishTime);
    //       }
    //       else {
    //         await nextAnimBlock.animation.forwardFinishes.endDelayPeriod;
    //       }
    //     }
    //   }
    // }

    return this.options.continuePrev;
  }

  // TODO: Complete this method
  commit(): void {
    const activeFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => {
      const a = blockA.activeFinishTime;
      const b = blockB.activeFinishTime;
      if (a < b) { return -1; }
      if (b < a) { return 1; }
      return 0;
    };

    const endDelayFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => {
      const a = blockA.activeFinishTime + blockA.endDelay;
      const b = blockB.activeFinishTime + blockB.endDelay;
      if (a < b) { return -1; }
      if (b < a) { return 1; }
      return 0;
    };

    let maxFinishTime = 0;
    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;
    this.animBlockGroupings_activeFinishOrder = [];
    this.animBlockGroupings_endDelayFinishOrder = [];
    let currActiveGrouping: AnimBlock[] = [];
    let currEndDelayGrouping: AnimBlock[] = [];

    for (let i = 0; i < numBlocks; ++i) {
      const startsWithPrev = !animBlocks[i-1]?.blocksNext;
      const currAnimBlock = animBlocks[i];
      const prevBlock = animBlocks[i-1];
      let currStartTime: number;
      if (startsWithPrev || i === 0) {
        currActiveGrouping.push(currAnimBlock);
        currEndDelayGrouping.push(currAnimBlock);

        currStartTime = prevBlock?.activeStartTime ?? 0;
      }
      else {
        currActiveGrouping.sort(activeFinishComparator);
        currEndDelayGrouping.sort(endDelayFinishComparator);
        this.animBlockGroupings_activeFinishOrder.push(currActiveGrouping);
        this.animBlockGroupings_endDelayFinishOrder.push(currEndDelayGrouping);
        currActiveGrouping = [currAnimBlock];
        currEndDelayGrouping = [currAnimBlock];

        currStartTime = maxFinishTime;
      }

      currAnimBlock.activeStartTime = currStartTime + currAnimBlock.delay;
      currAnimBlock.activeFinishTime = currAnimBlock.activeStartTime + +currAnimBlock.duration;

      maxFinishTime = Math.max(currAnimBlock.activeFinishTime + currAnimBlock.endDelay, maxFinishTime);
    }

    currActiveGrouping.sort(activeFinishComparator);
    currEndDelayGrouping.sort(endDelayFinishComparator);
    this.animBlockGroupings_activeFinishOrder.push(currActiveGrouping);
    this.animBlockGroupings_endDelayFinishOrder.push(currEndDelayGrouping);
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
