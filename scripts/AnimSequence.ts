import { AnimBlock, AnimTimelineAnimation } from "./AnimBlock.js";
import { AnimTimeline } from "./AnimTimeline.js";

type AnimSequenceConfig = {
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
  get description() {return this.config.description}
  get tag() {return this.config.tag} // helps idenfity current AnimSequence for using AnimTimeline's skipTo()
  private animBlocks: AnimBlock[] = []; // array of animBlocks
  private config: AnimSequenceConfig;

  private animBlockGroupings_activeFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_endDelayFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_backwardActiveFinishOrder: AnimBlock[][] = [];
  private animBlock_forwardGroupings: AnimBlock[][] = [[]];

  constructor(config: Partial<AnimSequenceConfig & {animBlocks: AnimBlock[]}>  = {}) {
    this.id = AnimSequence.id++;

    if (config.animBlocks) {
      this.addBlocks(...config.animBlocks);
    }

    this.config = {
      description: '<blank sequence description>',
      tag: '',
      continueNext: false, // decides whether the next AnimSequence should automatically play after this one
      continuePrev: false, // decides if the prev AnimSequence should automatically play after this one

      // user config takes priority
      ...config,
    };
  }

  getDescription() { return this.description; }
  getTag() { return this.tag; }
  
  setDescription(description: string): AnimSequence { this.config.description = description; return this; }
  setTag(tag: string): AnimSequence { this.config.tag = tag; return this; }
  setID(id: number) {
    this.timelineID = id;
    for (const animBlock of this.animBlocks) {
      animBlock.setID(this.id, this.timelineID);
      animBlock.parentTimeline = this.parentTimeline;
      animBlock.parentSequence = this;
    }
  }

  addBlocks(...animBlocks: AnimBlock[]): AnimSequence {
    // CHANGE NOTE: removed addOneBlock()
    this.animBlocks.push(...animBlocks);
    return this;
  }

  // plays each animBlock contained in this AnimSequence instance in sequential order
  // TODO: Overhaul current sequencing structure to make timing more intuitive (and fix some catastrophic edge cases)
  async play(): Promise<boolean> {
    this.commit();
    const activeGroupings = this.animBlockGroupings_activeFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      const groupingLength = activeGrouping.length;

      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].animation.awaitActiveForefinisher('forward', activeGrouping[j-1].animation.forwardFinishes.activePhase);
      }
    }

    // const animBlocks = this.animBlocks;
    // const numBlocks = animBlocks.length;
    // let parallelBlocks: Promise<void>[] = [];
    // for (let i = 0; i < numBlocks; ++i) {
    //   const currAnimBlock = animBlocks[i];
    //   const prevAnimBlock = animBlocks[i - 1];
    //   if (i === 0 || prevAnimBlock?.blocksNext === false) {
    //     if (prevAnimBlock) {
    //       await prevAnimBlock.animation.forwardFinishes.delayPeriod;
    //     }
        
    //     // const nextBlock = animBlocks[i + 1];
    //     // if (nextBlock && nextBlock.activeFinishTime < currAnimBlock.activeFinishTime)
    //     //   { currAnimBlock.adjecentForefinishers.push(nextBlock.animation.forwardFinishes.activePeriod); }
    //     // else if (nextBlock)
    //     //   { nextBlock.adjecentForefinishers.push(currAnimBlock.animation.forwardFinishes.activePeriod); }
          
    //     parallelBlocks.push(currAnimBlock.stepForward());
    //   }
    //   else {
    //     await Promise.all(parallelBlocks);
    //     parallelBlocks = [currAnimBlock.stepForward()];
    //   }


    //   // // if the current animBlock blocks the next animBlock, we need to await the completion (this is intuitive)
    //   // if (i === numBlocks - 1 || currAnimBlock.getBlocksNext())
    //   //   { await currAnimBlock.stepForward(); }
    //   // else
    //   //   { currAnimBlock.stepForward(); }
    // }

    let parallelBlocks: Promise<void>[] = [];
    for (let i = 0; i < this.animBlock_forwardGroupings.length; ++i) {
      const grouping = this.animBlock_forwardGroupings[i];
      parallelBlocks = [];
      parallelBlocks.push(grouping[0].stepForward());
      for (let j = 1; j < grouping.length; ++j) {
        await grouping[j-1].animation.forwardFinishes.delayPhase;
        const currAnimBlock = grouping[j];
        parallelBlocks.push(currAnimBlock.stepForward());
      }
      await Promise.all(parallelBlocks);
    }

    return this.config.continueNext;
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind(): Promise<boolean> {
    const activeGroupings = this.animBlockGroupings_backwardActiveFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      const groupingLength = activeGrouping.length;

      for (let j = 1; j < groupingLength; ++j) {
          activeGrouping[j].animation.awaitActiveForefinisher('backward', activeGrouping[j-1].animation.backwardFinishes.activePhase);
      }
    }

    // const animBlocks = this.animBlocks;
    // const numBlocks = animBlocks.length;
    // let parallelBlocks: Promise<void>[] = [];
    // for (let i = numBlocks - 1; i >= 0; --i) {
    //   const currAnimBlock = animBlocks[i];
    //   const nextAnimBlock = animBlocks[i + 1];
    //   if (i === numBlocks - 1 || nextAnimBlock?.blocksPrev === false) {
    //     parallelBlocks.push(currAnimBlock.stepBackward());
    //   }
    //   else {
    //     await Promise.all(parallelBlocks);
    //     parallelBlocks = [currAnimBlock.stepBackward()];
    //   }


    //   // if (i === 0 || currAnimBlock.getBlocksPrev())
    //   //   { await currAnimBlock.stepBackward(); }
    //   // else
    //   //   { currAnimBlock.stepBackward(); }
    // }

    // await Promise.all(parallelBlocks);

    
    let parallelBlocks: Promise<void>[] = [];
    const groupings = this.animBlockGroupings_endDelayFinishOrder;
    const groupingsLength = groupings.length;
    for (let i = groupingsLength - 1; i >= 0; --i) {
      const grouping = groupings[i];
      const groupingLength = grouping.length;
      parallelBlocks = [];
      parallelBlocks.push(grouping[groupingLength - 1].stepBackward());
      for (let j = groupingLength - 2; j >= 0; --j) {
        const currAnimBlock = grouping[j];
        const nextAnimBlock = grouping[j + 1];
        if (currAnimBlock.fullFinishTime > nextAnimBlock.fullStartTime) {
          await nextAnimBlock.animation.blockUntil('backward', nextAnimBlock.fullFinishTime - currAnimBlock.fullFinishTime);
        }
        else {
          await nextAnimBlock.animation.backwardFinishes.endDelayPhase;
        }

        parallelBlocks.push(currAnimBlock.stepBackward());
      }
      await Promise.all(parallelBlocks);
    }

    return this.config.continuePrev;
  }

  static activeBackwardFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => blockB.activeStartTime - blockA.activeStartTime;
  static activeFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => blockA.activeFinishTime - blockB.activeFinishTime;
  static endDelayFinishComparator = (blockA: AnimBlock, blockB: AnimBlock) => blockA.fullFinishTime - blockB.fullFinishTime;

  // TODO: Complete this method
  commit(): AnimSequence {
    const {
      activeBackwardFinishComparator,
      activeFinishComparator,
      endDelayFinishComparator,
    } = AnimSequence;

    let maxFinishTime = 0;
    const animBlocks = this.animBlocks;
    const numBlocks = animBlocks.length;
    this.animBlock_forwardGroupings = [[]];
    this.animBlockGroupings_backwardActiveFinishOrder = [];
    this.animBlockGroupings_activeFinishOrder = [];
    this.animBlockGroupings_endDelayFinishOrder = [];
    let currActiveBackwardFinishGrouping: AnimBlock[] = [];
    let currActiveFinishGrouping: AnimBlock[] = [];
    let currEndDelayGrouping: AnimBlock[] = [];

    for (let i = 0; i < numBlocks; ++i) {
      const startsWithPrev = !animBlocks[i-1]?.blocksNext;
      const currAnimBlock = animBlocks[i];
      const prevBlock = animBlocks[i-1];
      let currStartTime: number;

      if (startsWithPrev || i === 0) {
        // currActiveBackwardFinishGrouping.push(currAnimBlock);
        currActiveFinishGrouping.push(currAnimBlock);
        currEndDelayGrouping.push(currAnimBlock);

        currStartTime = prevBlock?.activeStartTime ?? 0;
      }
      else {
        this.animBlock_forwardGroupings.push([]);
        currActiveFinishGrouping.sort(activeFinishComparator);
        currEndDelayGrouping.sort(endDelayFinishComparator);
        currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
        currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
        this.animBlockGroupings_backwardActiveFinishOrder.push(currActiveBackwardFinishGrouping);
        this.animBlockGroupings_activeFinishOrder.push(currActiveFinishGrouping);
        this.animBlockGroupings_endDelayFinishOrder.push(currEndDelayGrouping);
        currActiveBackwardFinishGrouping = [currAnimBlock];
        currActiveFinishGrouping = [currAnimBlock];
        currEndDelayGrouping = [currAnimBlock];

        currStartTime = maxFinishTime;
      }

      this.animBlock_forwardGroupings[this.animBlock_forwardGroupings.length - 1].push(currAnimBlock);

      currAnimBlock.fullStartTime = currStartTime;

      maxFinishTime = Math.max(currAnimBlock.fullFinishTime, maxFinishTime);
    }

    currActiveFinishGrouping.sort(activeFinishComparator);
    currEndDelayGrouping.sort(endDelayFinishComparator);
    currActiveBackwardFinishGrouping = [...currEndDelayGrouping].reverse();
    currActiveBackwardFinishGrouping.sort(activeBackwardFinishComparator);
    this.animBlockGroupings_backwardActiveFinishOrder.push(currActiveBackwardFinishGrouping);
    this.animBlockGroupings_activeFinishOrder.push(currActiveFinishGrouping);
    this.animBlockGroupings_endDelayFinishOrder.push(currEndDelayGrouping);

    return this;
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
