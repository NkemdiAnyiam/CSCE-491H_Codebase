import { AnimBlock, AnimTimelineAnimation } from "./AnimBlock.js";
import { AnimBlockLine } from "./AnimBlockLine.js";

type AnimSequenceOptions = {
  description: string;
  tag: string;
  continueNext: boolean; // TODO: rename to autoNext
  continuePrev: boolean;
};

export class AnimSequence {
  static id = 0;
  
  id: number;
  timelineID: number = NaN; // set to match the id of the AnimTimeline to which it belongs
  parentTimeline: any; // pointer to parent AnimTimeline // TODO: fix annotation
  description: string = '<blank sequence description>';
  tag: string = ''; // helps idenfity current AnimSequence for using AnimTimeline's skipTo()
  animBlocks: AnimBlock[] = []; // array of animBlocks
  options: AnimSequenceOptions;

  constructor(animBlocks: AnimBlock[] | AnimBlock | null = null, options: Partial<AnimSequenceOptions> = {}) {
    this.id = AnimSequence.id++;

    if (animBlocks) {
      if (animBlocks instanceof Array) { this.addManyBlocks(animBlocks); }
      else { this.addOneBlock(animBlocks); }
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
    this.animBlocks.forEach(animBlock => {
      animBlock.setID(this.id, this.timelineID);
      animBlock.parentTimeline = this.parentTimeline;
      animBlock.parentSequence = this;
    });
  }


  // TODO: return 'this' after pushing blocks to support chaining
  addOneBlock(animBlock: AnimBlock) {
    this.animBlocks.push(animBlock);
  }

  addManyBlocks(animBlocks: AnimBlock[]) {
    animBlocks.forEach(animBlock => this.addOneBlock(animBlock));
  }

  // plays each animBlock contained in this AnimSequence instance in sequential order
  async play() {
    for (let i = 0; i < this.animBlocks.length; ++i) {
      // if the current animBlock blocks the next animBlock, we need to await the completion (this is intuitive)
      if (i === this.animBlocks.length - 1 || this.animBlocks[i].getBlocksNext())
        { await this.animBlocks[i].stepForward(); }
      else
        { this.animBlocks[i].stepForward(); }
    }

    return Promise.resolve(this.options.continueNext);
  }

  // rewinds each animBlock contained in this AnimSequence instance in reverse order
  async rewind() {
    for (let i = this.animBlocks.length - 1; i >= 0; --i) {
      if (i === 0 || this.animBlocks[i].getBlocksPrev())
        { await this.animBlocks[i].stepBackward(); }
      else
        { this.animBlocks[i].stepBackward(); }
    }

    return Promise.resolve(this.options.continuePrev);
  }

  // used to skip currently running animation so they don't run at regular speed while using skipping
  skipCurrentAnimations() {
    // get all currently running animations (if animations are currently running, we need to force them to finish)
    const allAnimations = document.getAnimations() as AnimTimelineAnimation[];
    // an animation "belongs" to this sequence if its sequence id matches
    for (let i = 0; i < allAnimations.length; ++i) {
      // an animation "belongs" to this sequence if its ids match
      if (allAnimations[i].sequenceID === this.id) { allAnimations[i].finish(); }
    }
  }
}
