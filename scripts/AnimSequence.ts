import { AnimBlock, AnimTimelineAnimation } from "./AnimBlock.js";
import { AnimTimeline } from "./AnimTimeline.js";

type AnimSequenceConfig = {
  description: string;
  tag: string;
  autoplaysNextSequence: boolean;
  autoplays: boolean;
};

type AnimationOperation = (animation: AnimBlock) => void; 

export class AnimSequence implements AnimSequenceConfig {
  static id = 0;
  
  id: number;
  timelineID: number = NaN; // set to match the id of the AnimTimeline to which it belongs
  parentTimeline?: AnimTimeline; // pointer to parent AnimTimeline
  description: string = '<blank sequence description>';
  tag: string = ''; // helps idenfity current AnimSequence for using AnimTimeline's skipTo()
  autoplaysNextSequence: boolean = false; // decides whether the next AnimSequence should automatically play after this one
  autoplays: boolean = false;
  basePlaybackRate: number = 1;
  get playbackRate() { return this.basePlaybackRate * (this.parentTimeline?.playbackRate ?? 1); }
  private animBlocks: AnimBlock[] = []; // array of animBlocks

  private animBlockGroupings_activeFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_endDelayFinishOrder: AnimBlock[][] = [];
  private animBlockGroupings_backwardActiveFinishOrder: AnimBlock[][] = [];
  private animBlock_forwardGroupings: AnimBlock[][] = [[]];
  private inProgressBlocks: Map<number, AnimBlock> = new Map();

  constructor(config: Partial<AnimSequenceConfig> = {}) {
    this.id = AnimSequence.id++;

    Object.assign(this, config);
  }

  getDescription() { return this.description; }
  getTag() { return this.tag; }
  
  setDescription(description: string): AnimSequence { this.description = description; return this; }
  setTag(tag: string): AnimSequence { this.tag = tag; return this; }
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
  async play(): Promise<void> {
    this.commit();
    const activeGroupings = this.animBlockGroupings_activeFinishOrder;
    // const activeGroupings2 = this.animBlockGroupings_endDelayFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      // const activeGrouping2 = activeGroupings2[i];
      const groupingLength = activeGrouping.length;

      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].addIntegrityblocks('forward', 'activePhase', 'end', activeGrouping[j-1].animation.getFinished('forward', 'activePhase'));
        // activeGrouping2[j].animation.addIntegrityblocks('forward', 'endDelayPhase', 'end', activeGrouping2[j-1].animation.getFinished('forward', 'endDelayPhase'));
      }
    }

    let parallelBlocks: Promise<void>[] = [];
    for (let i = 0; i < this.animBlock_forwardGroupings.length; ++i) {
      parallelBlocks = [];
      const grouping = this.animBlock_forwardGroupings[i];
      const firstBlock = grouping[0];
      this.inProgressBlocks.set(firstBlock.id, firstBlock);
      parallelBlocks.push(firstBlock.stepForward()
        .then(() => {this.inProgressBlocks.delete(firstBlock.id)})
      );

      for (let j = 1; j < grouping.length; ++j) {
        await grouping[j-1].animation.getFinished('forward', 'delayPhase');
        const currAnimBlock = grouping[j];
        this.inProgressBlocks.set(currAnimBlock.id, currAnimBlock);
        parallelBlocks.push(currAnimBlock.stepForward()
          .then(() => {this.inProgressBlocks.delete(currAnimBlock.id)})
        );
      }
      await Promise.all(parallelBlocks);
    }
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind(): Promise<void> {
    const activeGroupings = this.animBlockGroupings_backwardActiveFinishOrder;
    const numGroupings = activeGroupings.length;

    for (let i = 0; i < numGroupings; ++i) {
      const activeGrouping = activeGroupings[i];
      const groupingLength = activeGrouping.length;

      for (let j = 1; j < groupingLength; ++j) {
        activeGrouping[j].addIntegrityblocks('backward', 'activePhase', 'beginning', activeGrouping[j-1].animation.getFinished('backward', 'activePhase'));
      }
    }
    
    let parallelBlocks: Promise<void>[] = [];
    const groupings = this.animBlockGroupings_endDelayFinishOrder;
    const groupingsLength = groupings.length;
    for (let i = groupingsLength - 1; i >= 0; --i) {
      parallelBlocks = [];
      const grouping = groupings[i];
      const groupingLength = grouping.length;
      const lastBlock = grouping[groupingLength - 1];
      this.inProgressBlocks.set(lastBlock.id, lastBlock);
      parallelBlocks.push(lastBlock.stepBackward()
        .then(() => {this.inProgressBlocks.delete(lastBlock.id)})
      );

      for (let j = groupingLength - 2; j >= 0; --j) {
        const currAnimBlock = grouping[j];
        const nextAnimBlock = grouping[j + 1];
        if (currAnimBlock.fullFinishTime > nextAnimBlock.fullStartTime) {
          await nextAnimBlock.generateTimePromise('backward', 'whole', currAnimBlock.fullFinishTime - nextAnimBlock.fullStartTime);
        }
        else {
          await nextAnimBlock.animation.getFinished('backward', 'endDelayPhase');
        }

        this.inProgressBlocks.set(currAnimBlock.id, currAnimBlock);
        parallelBlocks.push(currAnimBlock.stepBackward()
          .then(() => {this.inProgressBlocks.delete(currAnimBlock.id)})
        );
      }
      await Promise.all(parallelBlocks);
    }
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
      const currAnimBlock = animBlocks[i];
      const prevBlock = animBlocks[i-1];
      // TODO: Consider override scenarios
      const startsWithPrev = currAnimBlock.startsWithPreviousBlock || prevBlock?.startsNextBlock;
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
  
  pause(): void {
    this.doForInProgressBlocks(animBlock => animBlock.pause());
  }

  resume(): void {
    this.doForInProgressBlocks(animBlock => animBlock.resume());
  }

  updatePlaybackRate(newRate: number) {
    // TODO: Account for the fact that animations will need to use multiplier if they already have a playbackRate set
    this.doForInProgressBlocks(animBlock => animBlock.multBasePlaybackRate(this.playbackRate));
  }

  // used to skip currently running animation so they don't run at regular speed while using skipping
  skipCurrentAnimations(): void {
    this.doForInProgressBlocks(animBlock => animBlock.finish());
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  doForInProgressBlocks(operation: AnimationOperation): void {
    for (const animBlock of this.inProgressBlocks.values()) {
      operation(animBlock);
    }
  }
}
