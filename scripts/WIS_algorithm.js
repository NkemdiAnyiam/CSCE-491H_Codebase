import { Job } from './Job.js';
import { JobScheduler } from './JobScheduler.js';
import { AnimObject } from './AnimObject.js';
import { AnimLine } from './AnimLine.js';
import { AnimBlock } from './AnimBlock.js';
import { AnimTimeline } from "./AnimTimeline.js";

const jobsUnsorted = [
  new Job('A', 5, 9, 7),
  new Job('B', 8, 11, 5),
  new Job('C', 0, 6, 2),
  new Job('D', 1, 4, 1),
  new Job('E', 3, 8, 5),
  new Job('F', 4, 7, 4),
  new Job('G', 6, 10, 3),
  new Job('H', 3, 5, 6),
];

const jobScheduler = new JobScheduler();

jobsUnsorted.forEach(job => {
  jobScheduler.addJob(job);
});
jobScheduler.sortJobsByFinish();
jobScheduler.setCompatibleJobNums();
jobScheduler.initializeM();

console.log(jobScheduler.computeOPT(jobScheduler.getNumJobs(), document.querySelector('.job-cards')));
jobScheduler.print();
jobScheduler.setUpScene();


const animTimeline = new AnimTimeline();

const timeGraphEl = document.querySelector('.time-graph');
const timeGraphRowEls = [...document.querySelectorAll('.time-graph__row')];
const jobBarEls = [...document.querySelectorAll('.time-graph__job-bar')];
const cArray = document.querySelector('.array--c');

// Move job bars onto time graph in unsorted order
const animBlock0 = new AnimBlock();
jobBarEls.forEach((jobBarEl) => {
  // set up options for moving job bars to correct location
  const jobLetter = jobBarEl.dataset.jobletter;
  const startCell = document.querySelector(`.time-graph__row[data-jobletterunsorted="${jobLetter}"]  .time-graph__cell--${jobBarEl.dataset.start}`);
  const options = { translateOptions: { targetElem: startCell } };
  animBlock0.addAnimObject(new AnimObject(jobBarEl, 'translate', options));
});
animTimeline.addBlock(animBlock0);

// Move job bars back off of the time graph
const animBlock1 = new AnimBlock();
jobBarEls.forEach((jobBarEl, i) => {
  const options = {blocksPrev: false, blocksNext: false, translateOptions: { targetElem: document.querySelector('.time-graph__job-bars') } };
  animBlock1.addAnimObject(new AnimObject(jobBarEl, 'translate', options));
});
animTimeline.addBlock(animBlock1);

// Move job bars back onto the time graph (sorted by finish time) and update time graph row headers
const animBlock2 = new AnimBlock();
jobBarEls.forEach((jobBarEl) => {
  // set up options for moving job bars to correct location
  const jobLetter = jobBarEl.dataset.jobletter;
  const row = document.querySelector(`.time-graph__row[data-joblettersorted="${jobLetter}"]`);
  const startCell = row.querySelector(`.time-graph__cell--${jobBarEl.dataset.start}`);
  const options = { blocksNext: false, translateOptions: { targetElem: startCell } };
  
  // get row's header data to animate
  const rowSJNum = row.querySelector('.time-graph__SJ-num');
  const rowUnsortedLetter = row.querySelector('.time-graph__job-letter--unsorted');
  const rowSortedLetter = row.querySelector('.time-graph__job-letter--sorted');
  
  animBlock2.addManyByParams([
    [ 'object', jobBarEl, 'translate', options ],
    [ 'object', rowUnsortedLetter, 'exit-wipe-to-left', {blocksPrev: false, duration: 250} ],
    [ 'object', rowSJNum, 'enter-wipe-from-right', {blocksNext: false, duration: 250} ],
    [ 'object', rowSortedLetter, 'enter-wipe-from-right', {blocksPrev: false, duration: 250} ],
  ]);
});
animTimeline.addBlock(animBlock2);

// Demonstrate how to fill out the c array
const cBar = document.querySelector('.time-graph__c-bar'); // vertical bar
const timeGraphArrowEl = timeGraphEl.querySelector('.free-line');
jobBarEls.forEach((jobBarEl, i) => {
  const jBlock = document.querySelector(`.array-group--j-and-c .array--j .array__array-block--${jobBarEl.dataset.sjnum}`);
  // Move cbar to current job bar, unhide it, and highlight current job bar
  animTimeline.addOneByParams([
    [ 'object', cBar, 'translate', {duration: 0, translateOptions: { targetElem: jobBarEl, preserveY: true }} ],
    [ 'object', jobBarEl, 'highlight', {blocksNext: false} ],
    [ 'object', jBlock, 'highlight', {blocksNext: false, blocksPrev: false} ],
    [ 'object', cBar, 'fade-in', {blocksPrev: false} ],
  ]);

  // Move cbar to compatible job bar and highlight it OR move cbar to left of time graph. Point arrow to current c-array entry
  const compatibleJobBarEl = document.querySelector(`.time-graph__job-bar[data-sjnum="${jobBarEl.dataset.compatiblejobnum}"]`);
  const cBlock = cArray.querySelector(`.array__array-block--${jobBarEl.dataset.sjnum}`);
  const cEntryValue = cBlock.querySelector(`.array__array-entry--value`);
  const cEntryBlank = cBlock.querySelector(`.array__array-entry--blank`)
  let row;
  let rowSJNum;
  const animBlock = new AnimBlock();
  if (compatibleJobBarEl) {
    row = document.querySelector(`.time-graph__row[data-joblettersorted="${compatibleJobBarEl.dataset.jobletter}"]`);
    rowSJNum = row.querySelector('.time-graph__SJ-num');
    animBlock.addManyByParams([
      [ 'object', cBar, 'translate', {translateOptions: { targetElem: compatibleJobBarEl, alignmentX: 'right', preserveY: true }} ],
      [ 'object', compatibleJobBarEl, 'highlight' ],
      [ 'line', timeGraphArrowEl, 'fade-in', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false} ],
    ]);
  }
  else {
    animBlock.addManyByParams([
      [ 'object', cBar, 'translate', {translateOptions: { targetElem: timeGraphEl, alignmentX: 'left', preserveY: true }} ],
      [ 'line', timeGraphArrowEl, 'fade-in', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false} ],
    ]);
  }

  // "Update" current c-array entry
  animBlock.addManyByParams([
    [ 'object', cEntryBlank, 'exit-wipe-to-left', {blocksPrev: false, blocksNext: false} ],
    [ 'object', cEntryValue, 'enter-wipe-from-right', {blocksPrev: false} ],
  ]);

  animTimeline.addBlock(animBlock);

  // Hide cbar and arrow; un-highlight compatible job bar if there was indeed one
  const animBlock_ = new AnimBlock();
  if (compatibleJobBarEl) {
    animBlock_.addOneByParams([ 'object', compatibleJobBarEl, 'un-highlight', {blocksNext: false} ]);
    animBlock_.addOneByParams([ 'line', timeGraphArrowEl, 'fade-out', rowSJNum, [1, 0.5], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
  }
  else {
    animBlock_.addOneByParams([ 'line', timeGraphArrowEl, 'fade-out', cBar, [0, 1], cBlock, [0.5, 0], {blocksPrev: false, blocksNext: false} ]);
  }
  animBlock_.addManyByParams([
    [ 'object', cBar, 'fade-out', {blocksNext: false, blocksPrev: false} ],
    [ 'object', jobBarEl, 'un-highlight', {blocksPrev: false, blocksNext: false} ],
    [ 'object', jBlock, 'un-highlight', {blocksPrev: false} ],
  ]);
  animTimeline.addBlock(animBlock_);
});



const goForward = async function() {
  return new Promise(async function(resolve) {
    backwardButton.removeEventListener('click', goBackward);
    forwardButton.removeEventListener('click', goForward);
    await animTimeline.stepForward();
    backwardButton.addEventListener('click', goBackward);
    forwardButton.addEventListener('click', goForward);

    resolve();
  });
};

const goBackward = async function() {
  return new Promise(async function(resolve) {
    backwardButton.removeEventListener('click', goBackward);
    forwardButton.removeEventListener('click', goForward);
    await animTimeline.stepBackward();
    backwardButton.addEventListener('click', goBackward);
    forwardButton.addEventListener('click', goForward);

    resolve();
  });
};


const backwardButton = document.querySelector('.box--backward');
const forwardButton = document.querySelector('.box--forward');
backwardButton.addEventListener('click', goBackward);
forwardButton.addEventListener('click', goForward);

const toggleSkipping = function(e) {
  if (e.key.toLowerCase() === 's' && !e.repeat) {
    window.removeEventListener('keyup', stopFastForward);
    window.removeEventListener('keydown', fastForward);
    animTimeline.toggleSkipping();
    window.addEventListener('keyup', stopFastForward);
    window.addEventListener('keydown', fastForward);
  }
};

const fastForward = function(e) {
  if (e.key.toLowerCase() === 'f') {
    animTimeline.fireRateSignal(7);
  }
};

const stopFastForward = function(e) {
  if (e.key.toLowerCase() === 'f') {
    animTimeline.fireRateSignal(1);
  }
};

window.addEventListener('keydown', toggleSkipping);
window.addEventListener('keydown', fastForward);
window.addEventListener('keyup', stopFastForward);





(function() {
  const jobCard = document.querySelector('.job-card');
  const jobCardContent = jobCard.querySelector('.job-card-content');
  const MAccess = jobCard.querySelector('.M-access');
  const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access .free-line')
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');

  const arrowContainer = jobCard.querySelector('.arrow-container');
  const formulaComputation = jobCard.querySelector('.formula-computation');
  const freeLine_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .free-line');
  const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box');

  const computationExpression1 = jobCard.querySelector('.computation-expression--1');
  const freeLine_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .free-line');
  const textbox_computationExpression1 = jobCard.querySelector('.text-box-line-group--computation-expression--1 .text-box');


  const animBlock1 = new AnimBlock(...[
    new AnimObject(jobCardContent, 'fade-in'),
    new AnimObject(MAccess, 'fade-in'),
    new AnimObject(MAccess, 'highlight', {blocksNext: false, blocksPrev: false}),
    new AnimLine(freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(textbox_MAccess, 'fade-in', {blocksPrev: false}),
  ]);

  const animBlock2 = new AnimBlock(...[
    new AnimObject(textbox_MAccess, 'fade-out', {blocksNext: false}),
    new AnimLine(freeLine_MAccess, 'fade-out', MAccess, [0.5, -0.2], null, [0.5, 1], {blocksNext: false}),
    new AnimObject(MAccess, 'un-highlight'),
    new AnimObject(arrowContainer, 'enter-wipe-from-right'),
    new AnimObject(formulaComputation, 'fade-in', {blocksPrev: false}),
    new AnimObject(formulaComputation, 'highlight', {blocksNext: false}),
    new AnimLine(freeLine_formulaComputation, 'fade-in', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(textbox_formulaComputation, 'fade-in', {blocksPrev: false}),
  ]);

  const animBlock3 = new AnimBlock(...[
    new AnimObject(textbox_formulaComputation, 'fade-out', {blocksNext: false}),
    new AnimLine(freeLine_formulaComputation, 'fade-out', formulaComputation, [0.1, 0.2], null, [0.5, 1], {blocksNext: false}),
    new AnimObject(formulaComputation, 'un-highlight', {blocksPrev: false}),
    new AnimObject(computationExpression1, 'highlight', {blocksNext: false}),
    new AnimLine(freeLine_computationExpression1, 'fade-in', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksPrev: false}),
    new AnimObject(textbox_computationExpression1, 'fade-in', {blocksPrev: false}),
    new AnimLine(freeLine_MAccess, 'fade-in', MAccess, [0.5, -0.2], computationExpression1, [0.5, 1], {blocksPrev: false}),
  ]);

  const animBlock4 = new AnimBlock(...[
    new AnimObject(textbox_computationExpression1, 'fade-out', {blocksNext: false}),
    new AnimLine(freeLine_computationExpression1, 'fade-out', computationExpression1, [0.5, -0.2], null, [0.5, 1], {blocksNext: false}),
    new AnimObject(computationExpression1, 'un-highlight', {blocksNext: false, blocksPrev: false}),
  ]);

  const animSequence = new AnimTimeline(...[
    animBlock1,
    animBlock2,
    animBlock3,
    animBlock4,
  ]);



  

  const goForward = async function() {
    return new Promise(async function(resolve) {
      backwardButton.removeEventListener('click', goBackward);
      forwardButton.removeEventListener('click', goForward);
      await animSequence.stepForward();
      backwardButton.addEventListener('click', goBackward);
      forwardButton.addEventListener('click', goForward);

      resolve();
    });
  };

  const goBackward = async function() {
    return new Promise(async function(resolve) {
      backwardButton.removeEventListener('click', goBackward);
      forwardButton.removeEventListener('click', goForward);
      await animSequence.stepBackward();
      backwardButton.addEventListener('click', goBackward);
      forwardButton.addEventListener('click', goForward);

      resolve();
    });
  };

  
  const backwardButton = document.querySelector('.box--backward');
  const forwardButton = document.querySelector('.box--forward');
  backwardButton.addEventListener('click', goBackward);
  forwardButton.addEventListener('click', goForward);

  const toggleSkipping = function(e) {
    if (e.key.toLowerCase() === 's' && !e.repeat) {
      window.removeEventListener('keyup', stopFastForward);
      window.removeEventListener('keydown', fastForward);
      animSequence.toggleSkipping();
      window.addEventListener('keyup', stopFastForward);
      window.addEventListener('keydown', fastForward);
    }
  };

  const fastForward = function(e) {
    if (e.key.toLowerCase() === 'f') {
      animSequence.fireRateSignal(7);
    }
  };

  const stopFastForward = function(e) {
    if (e.key.toLowerCase() === 'f') {
      animSequence.fireRateSignal(1);
    }
  };

  window.addEventListener('keydown', toggleSkipping);
  window.addEventListener('keydown', fastForward);
  window.addEventListener('keyup', stopFastForward);

  // const card2 = document.querySelector('div[data-card-num="2"]');
  // console.log(card2);
  // card2.style.left = '30rem';
});
